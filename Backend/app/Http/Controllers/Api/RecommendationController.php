<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RecommendationResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load(['profile', 'interests']);
        $registeredEventIds = $user->registrations()
            ->whereIn('status', ['confirmed', 'cancelled_by_event'])
            ->pluck('event_id')
            ->map(fn ($id) => (int) $id)
            ->toArray();

        $bookmarkedEvents = $user->bookmarkedEvents()->with(['category', 'organizer'])->get();
        $registeredEvents = $user->registeredEvents()->with(['category', 'organizer'])->get();

        $events = Event::query()
            ->publishedPublic()
            ->where('start_date', '>=', now())
            ->whereNotIn('id', $registeredEventIds)
            ->with(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])
            ->withCount(['registrations', 'bookmarks', 'reports'])
            ->limit(100)
            ->get();

        $recommendations = $events
            ->map(fn (Event $event) => $this->scoreEvent($event, $user, $bookmarkedEvents, $registeredEvents))
            ->filter(fn (array $item) => $item['score'] > 0)
            ->sortByDesc('score')
            ->values();

        $limit = min((int) $request->input('limit', 30), 100);
        $limited = $recommendations->take($limit);

        return response()->json([
            'summary' => [
                'total' => $recommendations->count(),
                'interest_based' => $recommendations->filter(fn ($item) => $this->hasReasonContaining($item, 'interest'))->count(),
                'location_based' => $recommendations->filter(fn ($item) => $this->hasReasonContaining($item, 'region') || $this->hasReasonContaining($item, 'city'))->count(),
                'activity_based' => $recommendations->filter(fn ($item) => $this->hasReasonContaining($item, 'saved') || $this->hasReasonContaining($item, 'registered') || $this->hasReasonContaining($item, 'organizer'))->count(),
            ],
            'recommendations' => RecommendationResource::collection($limited),
        ]);
    }

    private function scoreEvent(Event $event, $user, Collection $bookmarkedEvents, Collection $registeredEvents): array
    {
        $score = 0;
        $reasons = [];
        $interestNames = $user->interests->pluck('name')->map(fn ($name) => strtolower($name))->toArray();
        $interestSlugs = $user->interests->pluck('slug')->map(fn ($slug) => strtolower($slug))->toArray();
        $bookmarkedCategories = $bookmarkedEvents->pluck('category.name')->filter()->map(fn ($name) => strtolower($name))->toArray();
        $registeredCategories = $registeredEvents->pluck('category.name')->filter()->map(fn ($name) => strtolower($name))->toArray();
        $bookmarkedOrganizers = $bookmarkedEvents->pluck('organizer_id')->filter()->map(fn ($id) => (int) $id)->toArray();
        $registeredOrganizers = $registeredEvents->pluck('organizer_id')->filter()->map(fn ($id) => (int) $id)->toArray();

        $categoryName = strtolower((string) $event->category?->name);
        $categorySlug = strtolower((string) $event->category?->slug);

        if ($categoryName && (in_array($categoryName, $interestNames, true) || in_array($categorySlug, $interestSlugs, true))) {
            $score += 50;
            $reasons[] = 'Matches your '.$event->category->name.' interest';
        }

        if ($categoryName && in_array($categoryName, $bookmarkedCategories, true)) {
            $score += 25;
            $reasons[] = 'Similar to events you saved';
        }

        if ($categoryName && in_array($categoryName, $registeredCategories, true)) {
            $score += 35;
            $reasons[] = 'Similar to events you registered for';
        }

        if (in_array((int) $event->organizer_id, $bookmarkedOrganizers, true) || in_array((int) $event->organizer_id, $registeredOrganizers, true)) {
            $score += 20;
            $reasons[] = 'From an organizer you interacted with';
        }

        if ($user->profile?->region && $event->region?->name === $user->profile->region) {
            $score += 20;
            $reasons[] = 'Near your region: '.$event->region->name;
        }

        if ($user->profile?->city && $event->city?->name === $user->profile->city) {
            $score += 15;
            $reasons[] = 'In your city: '.$event->city->name;
        }

        if ((float) $event->price === 0.0) {
            $score += 5;
            $reasons[] = 'Free event';
        }

        if ((int) $event->views >= 50) {
            $score += min(10, (int) floor($event->views / 10));
            $reasons[] = 'Popular event';
        }

        $score += 10;
        $reasons[] = 'Upcoming event';

        return [
            'event' => $event,
            'score' => min(100, $score),
            'reasons' => array_values(array_unique($reasons)),
        ];
    }

    private function hasReasonContaining(array $item, string $needle): bool
    {
        return collect($item['reasons'])->contains(fn ($reason) => str_contains(strtolower($reason), $needle));
    }
}
