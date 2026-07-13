<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookmarkResource;
use App\Models\Bookmark;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookmarks = Bookmark::query()
            ->where('user_id', $request->user()->id)
            ->with(['event.organizer.role', 'event.organizer.profile', 'event.category', 'event.region', 'event.division', 'event.city', 'event.images'])
            ->latest()
            ->paginate(min((int) $request->input('per_page', 12), 50));

        return response()->json([
            'bookmarks' => BookmarkResource::collection($bookmarks),
        ]);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $this->ensureEventCanBeSaved($event);

        $bookmark = Bookmark::firstOrCreate([
            'user_id' => $request->user()->id,
            'event_id' => $event->id,
        ]);

        return response()->json([
            'message' => 'Event bookmarked successfully.',
            'bookmark' => new BookmarkResource($bookmark->load(['event.category', 'event.region', 'event.division', 'event.city', 'event.images'])),
        ], $bookmark->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, Event $event): JsonResponse
    {
        Bookmark::query()
            ->where('user_id', $request->user()->id)
            ->where('event_id', $event->id)
            ->delete();

        return response()->json([
            'message' => 'Event bookmark removed successfully.',
        ]);
    }

    private function ensureEventCanBeSaved(Event $event): void
    {
        if ($event->status !== 'published' || $event->visibility !== 'public') {
            abort(422, 'Only published public events can be bookmarked.');
        }
    }
}
