<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Http\Resources\UserResource;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with(['role', 'profile'])
            ->withCount(['registrations'])
            ->where('status', 'active')
            ->whereHas('role', fn ($roleQuery) => $roleQuery->where('name', 'organizer'));

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->where('name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhereHas('profile', fn ($profileQuery) => $profileQuery
                        ->where('organization_name', 'like', "%{$keyword}%")
                        ->orWhere('city', 'like', "%{$keyword}%")
                        ->orWhere('region', 'like', "%{$keyword}%"));
            });
        }

        if ($request->boolean('verified')) {
            $query->whereHas('profile', fn ($profileQuery) => $profileQuery->where('is_verified_organizer', true));
        }

        $organizers = $query
            ->withCount(['organizedEvents as published_events_count' => fn ($eventQuery) => $eventQuery->publishedPublic()])
            ->orderByDesc('published_events_count')
            ->orderBy('name')
            ->paginate(min((int) $request->input('per_page', 12), 50));

        return response()->json([
            'organizers' => UserResource::collection($organizers),
        ]);
    }

    public function show(User $organizer): JsonResponse
    {
        $organizer->load(['role', 'profile']);

        if ($organizer->status !== 'active' || ! $organizer->hasRole('organizer')) {
            abort(404);
        }

        $events = Event::query()
            ->where('organizer_id', $organizer->id)
            ->publishedPublic()
            ->with(['organizer.role', 'organizer.profile', 'category', 'region', 'division', 'city', 'images', 'ticketTypes'])
            ->withCount(['registrations', 'bookmarks', 'reports'])
            ->orderBy('start_date')
            ->paginate(12);

        return response()->json([
            'organizer' => new UserResource($organizer),
            'events' => EventResource::collection($events),
        ]);
    }
}
