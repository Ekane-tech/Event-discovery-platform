<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EventReview\StoreEventReviewRequest;
use App\Http\Resources\EventReviewResource;
use App\Models\Event;
use App\Models\EventReview;
use App\Models\Registration;
use App\Notifications\NewReviewNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EventReviewController extends Controller
{
    public function index(Request $request, Event $event): JsonResponse
    {
        $reviews = $event->reviews()
            ->with('user.profile')
            ->latest()
            ->paginate(min((int) $request->input('per_page', 10), 50));

        return response()->json([
            'reviews' => EventReviewResource::collection($reviews),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    public function summary(Request $request, Event $event): JsonResponse
    {
        $cacheKey = 'event:'.$event->id.':reviews:summary';

        $summary = null;
        try {
            $cached = Cache::get($cacheKey);
            if ($cached !== null) {
                $summary = $cached;
            }
        } catch (\Throwable) {
            // Cache is best-effort; never block the response.
        }

        if ($summary === null) {
            $summary = $this->computeSummary($event);
            try {
                Cache::put($cacheKey, $summary, now()->addMinutes(5));
            } catch (\Throwable) {
            }
        }

        // Per-user eligibility + existing review are never cached.
        $user = $request->user();
        $userReview = null;
        $canReview = false;
        $reason = 'not_authenticated';

        if ($user) {
            $userReview = $event->reviews()
                ->where('user_id', $user->id)
                ->with('user.profile')
                ->first();

            $eligibility = $this->resolveEligibility($event, $user, $userReview !== null);
            $canReview = $eligibility['can_review'];
            $reason = $eligibility['reason'];
        }

        return response()->json([
            'summary' => [
                'average_rating' => $summary['average_rating'],
                'reviews_count' => $summary['reviews_count'],
                'distribution' => $summary['distribution'],
                'can_review' => $canReview,
                'review_reason' => $reason,
                'user_review' => $userReview ? new EventReviewResource($userReview) : null,
            ],
        ]);
    }

    public function store(StoreEventReviewRequest $request, Event $event): JsonResponse
    {
        $user = $request->user();

        $eligibility = $this->resolveEligibility($event, $user);
        if (! $eligibility['can_review']) {
            abort(422, $this->reasonMessage($eligibility['reason']));
        }

        $review = $event->reviews()->create([
            'user_id' => $user->id,
            'rating' => $request->integer('rating'),
            'comment' => $request->input('comment'),
        ]);

        $this->bustSummaryCache($event);
        $this->notifyOrganizer($review);

        return response()->json([
            'message' => 'Review submitted successfully.',
            'review' => new EventReviewResource($review->load('user.profile')),
        ], 201);
    }

    public function update(StoreEventReviewRequest $request, Event $event, EventReview $review): JsonResponse
    {
        if ((int) $review->event_id !== (int) $event->id) {
            abort(404);
        }

        if ((int) $review->user_id !== (int) $request->user()->id) {
            abort(403, 'You can only edit your own review.');
        }

        $review->update([
            'rating' => $request->integer('rating'),
            'comment' => $request->input('comment'),
        ]);

        $this->bustSummaryCache($event);

        return response()->json([
            'message' => 'Review updated successfully.',
            'review' => new EventReviewResource($review->load('user.profile')),
        ]);
    }

    public function destroy(Request $request, Event $event, EventReview $review): JsonResponse
    {
        if ((int) $review->event_id !== (int) $event->id) {
            abort(404);
        }

        $user = $request->user();
        $isOwner = (int) $review->user_id === (int) $user->id;
        $isOrganizer = (int) $event->organizer_id === (int) $user->id;
        $isAdmin = $user->hasRole('admin');

        if (! $isOwner && ! $isOrganizer && ! $isAdmin) {
            abort(403, 'You are not allowed to delete this review.');
        }

        $review->delete();
        $this->bustSummaryCache($event);

        return response()->json([
            'message' => 'Review removed successfully.',
        ]);
    }

    private function computeSummary(Event $event): array
    {
        $aggregate = $event->reviews()
            ->selectRaw('COUNT(*) as total, AVG(rating) as average')
            ->first();

        $distributionRows = $event->reviews()
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating');

        $distribution = [];
        foreach ([5, 4, 3, 2, 1] as $star) {
            $distribution[$star] = (int) ($distributionRows[$star] ?? 0);
        }

        return [
            'average_rating' => $aggregate && $aggregate->average !== null ? round((float) $aggregate->average, 2) : null,
            'reviews_count' => (int) ($aggregate->total ?? 0),
            'distribution' => $distribution,
        ];
    }

    private function resolveEligibility(Event $event, $user, ?bool $alreadyReviewed = null): array
    {
        $alreadyReviewed ??= $event->reviews()->where('user_id', $user->id)->exists();

        if ($alreadyReviewed) {
            return ['can_review' => false, 'reason' => 'already_reviewed'];
        }

        if (! $this->eventHasEnded($event)) {
            return ['can_review' => false, 'reason' => 'event_not_ended'];
        }

        $hasConfirmedRegistration = Registration::query()
            ->where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->where('status', 'confirmed')
            ->exists();

        if (! $hasConfirmedRegistration) {
            return ['can_review' => false, 'reason' => 'not_registered'];
        }

        return ['can_review' => true, 'reason' => 'ok'];
    }

    private function eventHasEnded(Event $event): bool
    {
        $endedAt = $event->end_date ?: $event->start_date;

        return $endedAt !== null && $endedAt->isPast();
    }

    private function reasonMessage(string $reason): string
    {
        return match ($reason) {
            'already_reviewed' => 'You have already reviewed this event.',
            'event_not_ended' => 'Reviews open after the event has ended.',
            'not_registered' => 'Only attendees with a confirmed registration can review this event.',
            default => 'You cannot review this event.',
        };
    }

    private function bustSummaryCache(Event $event): void
    {
        try {
            Cache::forget('event:'.$event->id.':reviews:summary');
        } catch (\Throwable) {
        }
    }

    private function notifyOrganizer(EventReview $review): void
    {
        $organizer = $review->event?->organizer;

        if (! $organizer) {
            return;
        }

        try {
            $organizer->notify(new NewReviewNotification($review));
        } catch (\Throwable) {
            // Notifications must never break review submission.
        }
    }
}
