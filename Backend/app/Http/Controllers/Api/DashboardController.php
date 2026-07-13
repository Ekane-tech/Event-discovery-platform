<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookmarkResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\RegistrationResource;
use App\Models\Bookmark;
use App\Models\Category;
use App\Models\City;
use App\Models\Event;
use App\Models\Interest;
use App\Models\Region;
use App\Models\Registration;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function userDashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $upcomingRegistrations = Registration::query()
            ->where('user_id', $user->id)
            ->whereHas('event', fn ($query) => $query->where('start_date', '>=', now()))
            ->with(['event.category', 'event.region', 'event.division', 'event.city', 'event.images'])
            ->latest()
            ->limit(5)
            ->get();

        $recentBookmarks = Bookmark::query()
            ->where('user_id', $user->id)
            ->with(['event.category', 'event.region', 'event.division', 'event.city', 'event.images'])
            ->latest()
            ->limit(5)
            ->get();

        $interestIds = $user->interests()->pluck('interests.id');
        $interestCategoryNames = $user->interests()->pluck('interests.name')->map(fn ($name) => strtolower($name))->toArray();

        $recommendedEvents = Event::query()
            ->publishedPublic()
            ->with(['category', 'region', 'division', 'city', 'images'])
            ->withCount(['registrations', 'bookmarks'])
            ->where(function ($query) use ($interestCategoryNames, $user) {
                if (! empty($interestCategoryNames)) {
                    $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->whereIn(DB::raw('LOWER(name)'), $interestCategoryNames));
                }

                if ($user->profile?->region) {
                    $query->orWhereHas('region', fn ($regionQuery) => $regionQuery->where('name', $user->profile->region));
                }
            })
            ->whereDoesntHave('registrations', fn ($query) => $query->where('user_id', $user->id))
            ->orderBy('start_date')
            ->limit(6)
            ->get();

        return response()->json([
            'summary' => [
                'interests_count' => $interestIds->count(),
                'bookmarks_count' => $user->bookmarks()->count(),
                'registrations_count' => $user->registrations()->count(),
                'upcoming_registrations_count' => $user->registrations()->whereHas('event', fn ($query) => $query->where('start_date', '>=', now()))->count(),
                'unread_notifications_count' => $user->unreadNotifications()->count(),
                'recommendations_count' => $recommendedEvents->count(),
            ],
            'upcoming_registrations' => RegistrationResource::collection($upcomingRegistrations),
            'recent_bookmarks' => BookmarkResource::collection($recentBookmarks),
            'recent_notifications' => NotificationResource::collection($user->notifications()->latest()->limit(5)->get()),
            'recommended_events' => EventResource::collection($recommendedEvents),
        ]);
    }

    public function organizerDashboard(Request $request): JsonResponse
    {
        $organizer = $request->user();

        $eventsQuery = Event::query()->where('organizer_id', $organizer->id);
        $eventIds = (clone $eventsQuery)->pluck('id');

        $recentEvents = (clone $eventsQuery)
            ->with(['category', 'region', 'division', 'city', 'images'])
            ->withCount(['registrations', 'bookmarks', 'reports'])
            ->latest()
            ->limit(5)
            ->get();

        $upcomingEvents = (clone $eventsQuery)
            ->where('start_date', '>=', now())
            ->with(['category', 'region', 'division', 'city'])
            ->orderBy('start_date')
            ->limit(5)
            ->get();

        $totalRegistrations = Registration::query()->whereIn('event_id', $eventIds)->count();
        $confirmedRegistrations = Registration::query()->whereIn('event_id', $eventIds)->where('status', 'confirmed')->count();
        $totalCapacity = (clone $eventsQuery)->sum('maximum_participants');

        $revenue = Event::query()
            ->where('organizer_id', $organizer->id)
            ->leftJoin('registrations', 'events.id', '=', 'registrations.event_id')
            ->where(function ($query) {
                $query->whereNull('registrations.status')->orWhere('registrations.status', 'confirmed');
            })
            ->selectRaw('COALESCE(SUM(events.price), 0) as revenue')
            ->value('revenue');

        return response()->json([
            'summary' => [
                'events_count' => (clone $eventsQuery)->count(),
                'published_events_count' => (clone $eventsQuery)->where('status', 'published')->count(),
                'pending_events_count' => (clone $eventsQuery)->where('status', 'pending')->count(),
                'draft_events_count' => (clone $eventsQuery)->where('status', 'draft')->count(),
                'total_registrations' => $totalRegistrations,
                'confirmed_registrations' => $confirmedRegistrations,
                'total_views' => (clone $eventsQuery)->sum('views'),
                'revenue' => (float) $revenue,
                'attendance_rate' => $totalCapacity > 0 ? round(($confirmedRegistrations / $totalCapacity) * 100, 2) : 0,
            ],
            'recent_events' => EventResource::collection($recentEvents),
            'upcoming_events' => EventResource::collection($upcomingEvents),
        ]);
    }

    public function adminDashboard(): JsonResponse
    {
        $recentUsers = User::query()
            ->with(['role', 'profile'])
            ->latest()
            ->limit(5)
            ->get();

        $eventsNeedingReview = Event::query()
            ->whereIn('status', ['pending', 'rejected'])
            ->with(['organizer.role', 'category', 'region', 'city'])
            ->withCount(['reports', 'registrations'])
            ->latest()
            ->limit(8)
            ->get();

        $recentReports = Report::query()
            ->with(['event', 'reporter.role'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($report) => [
                'id' => $report->id,
                'type' => $report->type,
                'message' => $report->message,
                'status' => $report->status,
                'event' => $report->event ? [
                    'id' => $report->event->id,
                    'title' => $report->event->title,
                ] : null,
                'reporter' => $report->reporter ? [
                    'id' => $report->reporter->id,
                    'name' => $report->reporter->name,
                    'email' => $report->reporter->email,
                ] : null,
                'created_at' => $report->created_at,
            ]);

        return response()->json([
            'summary' => [
                'users_count' => User::count(),
                'registered_users_count' => User::whereHas('role', fn ($query) => $query->where('name', 'user'))->count(),
                'organizers_count' => User::whereHas('role', fn ($query) => $query->where('name', 'organizer'))->count(),
                'admins_count' => User::whereHas('role', fn ($query) => $query->where('name', 'admin'))->count(),
                'events_count' => Event::count(),
                'published_events_count' => Event::where('status', 'published')->count(),
                'pending_events_count' => Event::where('status', 'pending')->count(),
                'categories_count' => Category::count(),
                'interests_count' => Interest::count(),
                'regions_count' => Region::count(),
                'cities_count' => City::count(),
                'registrations_count' => Registration::count(),
                'bookmarks_count' => Bookmark::count(),
                'reports_count' => Report::count(),
                'open_reports_count' => Report::where('status', 'open')->count(),
            ],
            'recent_users' => $recentUsers->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->name,
                'city' => $user->profile?->city,
                'region' => $user->profile?->region,
                'created_at' => $user->created_at,
            ]),
            'events_needing_review' => EventResource::collection($eventsNeedingReview),
            'recent_reports' => $recentReports,
        ]);
    }
}
