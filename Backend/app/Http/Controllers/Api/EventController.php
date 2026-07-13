<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Event\StoreEventRequest;
use App\Http\Requests\Event\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Http\Resources\RegistrationResource;
use App\Jobs\SendEventInterestNotificationsJob;
use App\Models\Event;
use App\Models\EventImage;
use App\Models\EventView;
use App\Models\AuditLog;
use App\Notifications\EventAvailableNotification;
use App\Notifications\EventOrganizerModerationNotification;
use App\Notifications\EventUnavailableNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::query()
            ->with(['organizer.role', 'organizer.profile', 'category', 'region', 'division', 'city', 'images'])
            ->withCount(['registrations', 'bookmarks', 'reports']);

        if (! $request->user()?->hasRole('admin')) {
            $query->publishedPublic();
        } elseif ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $this->applyFilters($query, $request);
        $this->applySorting($query, $request);

        return response()->json([
            'events' => EventResource::collection($query->paginate(min((int) $request->input('per_page', 12), 50))),
        ]);
    }

    public function show(Event $event): JsonResponse
    {
        $user = request()->user();

        if (($event->status !== 'published' || $event->visibility !== 'public')
            && ! $user?->hasRole('admin')
            && ! ((int) $event->organizer_id === (int) $user?->id)) {
            abort(404);
        }

        $this->recordUniqueView($event, request());

        return response()->json([
            'event' => new EventResource($event->fresh()->load(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])->loadCount(['registrations', 'bookmarks', 'reports'])),
        ]);
    }

    public function organizerShow(Request $request, Event $event): JsonResponse
    {
        if (! $request->user()->hasRole('admin') && (int) $event->organizer_id !== (int) $request->user()->id) {
            abort(403, 'You do not have permission to view this organizer event.');
        }

        return response()->json([
            'event' => new EventResource($event->load(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])->loadCount(['registrations', 'bookmarks', 'reports'])),
        ]);
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $eventData = Arr::except($validated, ['category_ids', 'images']);

        $event = Event::create([
            ...$eventData,
            'organizer_id' => $request->user()->id,
            'price' => $validated['price'] ?? 0,
            'status' => $validated['status'] ?? 'draft',
            'visibility' => $validated['visibility'] ?? 'public',
        ]);

        $this->syncCategories($event, $validated);
        $this->syncImages($event, $validated['images'] ?? []);

        if ($event->status === 'published' && $event->visibility === 'public') {
            SendEventInterestNotificationsJob::dispatch($event->id);
        }

        return response()->json([
            'message' => 'Event created successfully.',
            'event' => new EventResource($event->load(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])),
        ], 201);
    }

    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $wasAvailable = $event->status === 'published' && $event->visibility === 'public';
        $validated = $request->validated();
        $eventData = Arr::except($validated, ['category_ids', 'images']);

        if (! $request->user()->hasRole('admin')) {
            unset($eventData['status']);
        }

        $event->update([
            ...$eventData,
            'price' => $validated['price'] ?? 0,
            'visibility' => $validated['visibility'] ?? 'public',
        ]);

        $this->syncCategories($event, $validated);

        if (array_key_exists('images', $validated)) {
            $event->images()->delete();
            $this->syncImages($event, $validated['images'] ?? []);
        }

        $event->refresh();
        $this->handleAvailabilityTransition($event, $wasAvailable);

        return response()->json([
            'message' => 'Event updated successfully.',
            'event' => new EventResource($event->fresh()->load(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])),
        ]);
    }

    public function destroy(Event $event): JsonResponse
    {
        $user = request()->user();

        if (! $user->hasRole('admin') && ! ($user->hasRole('organizer') && (int) $event->organizer_id === (int) $user->id)) {
            abort(403, 'You do not have permission to delete this event.');
        }

        $event->update(['status' => 'cancelled']);
        $this->handleEventUnavailable($event->fresh(), 'cancelled');
        $event->delete();

        return response()->json(['message' => 'Event deleted successfully.']);
    }

    public function uploadImages(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasRole('admin') && ! ($user->hasRole('organizer') && (int) $event->organizer_id === (int) $user->id)) {
            abort(403, 'You do not have permission to upload images for this event.');
        }

        $request->validate([
            'cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'gallery' => ['nullable', 'array', 'max:8'],
            'gallery.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $incomingGalleryCount = count($request->file('gallery', []));
        $existingGalleryCount = $event->images()->where('is_cover', false)->count();

        if ($existingGalleryCount + $incomingGalleryCount > 8) {
            return response()->json([
                'message' => 'Gallery limit reached. Keep a maximum of 8 gallery images per event.',
            ], 422);
        }

        if ($request->hasFile('cover')) {
            foreach ($event->images()->where('is_cover', true)->get() as $oldCover) {
                Storage::disk('public')->delete($oldCover->path);
                $oldCover->delete();
            }
            $path = $request->file('cover')->store('events/'.$event->id, 'public');
            $event->images()->create(['path' => $path, 'type' => 'cover', 'is_cover' => true]);
        }

        foreach ($request->file('gallery', []) as $image) {
            $path = $image->store('events/'.$event->id, 'public');
            $event->images()->create(['path' => $path, 'type' => 'gallery', 'is_cover' => false]);
        }

        AuditLog::record($request->user(), 'event.images.updated', $event, 'Event photos were updated.', [
            'cover_uploaded' => $request->hasFile('cover'),
            'gallery_uploaded' => $incomingGalleryCount,
        ]);

        return response()->json([
            'message' => 'Event images uploaded successfully.',
            'event' => new EventResource($event->fresh()->load(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])),
        ]);
    }

    public function deleteImage(Request $request, Event $event, EventImage $image): JsonResponse
    {
        $user = $request->user();

        if ((int) $image->event_id !== (int) $event->id) {
            abort(404);
        }

        if (! $user->hasRole('admin') && ! ($user->hasRole('organizer') && (int) $event->organizer_id === (int) $user->id)) {
            abort(403, 'You do not have permission to delete images for this event.');
        }

        $wasCover = (bool) $image->is_cover;

        Storage::disk('public')->delete($image->path);
        $image->delete();

        if ($wasCover) {
            $replacement = $event->images()->oldest()->first();
            if ($replacement) {
                $replacement->update(['is_cover' => true, 'type' => 'cover']);
            }
        }

        AuditLog::record($request->user(), 'event.image.deleted', $event, 'An event photo was deleted.', [
            'image_id' => $image->id,
            'was_cover' => $wasCover,
        ]);

        return response()->json([
            'message' => 'Event image deleted successfully.',
            'event' => new EventResource($event->fresh()->load(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])),
        ]);
    }

    public function setCoverImage(Request $request, Event $event, EventImage $image): JsonResponse
    {
        $user = $request->user();

        if ((int) $image->event_id !== (int) $event->id) {
            abort(404);
        }

        if (! $user->hasRole('admin') && ! ($user->hasRole('organizer') && (int) $event->organizer_id === (int) $user->id)) {
            abort(403, 'You do not have permission to manage images for this event.');
        }

        $event->images()->update(['is_cover' => false, 'type' => 'gallery']);
        $image->update(['is_cover' => true, 'type' => 'cover']);

        AuditLog::record($user, 'event.cover.updated', $event, 'Event cover photo was changed.', [
            'image_id' => $image->id,
        ]);

        return response()->json([
            'message' => 'Cover image updated successfully.',
            'event' => new EventResource($event->fresh()->load(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])),
        ]);
    }

    public function duplicate(Request $request, Event $event): JsonResponse
    {
        if (! $request->user()->hasRole('admin') && (int) $event->organizer_id !== (int) $request->user()->id) {
            abort(403, 'You do not have permission to duplicate this event.');
        }

        $event->loadMissing(['images', 'categories']);

        $copy = $event->replicate(['slug', 'views']);
        $copy->title = $event->title.' (Copy)';
        $copy->slug = Event::generateUniqueSlug($copy->title);
        $copy->status = 'draft';
        $copy->views = 0;
        $copy->push();
        $copy->categories()->sync($event->categories()->pluck('categories.id')->all());

        foreach ($event->images as $image) {
            $newPath = 'events/'.$copy->id.'/'.basename($image->path);
            if (Storage::disk('public')->exists($image->path)) {
                Storage::disk('public')->copy($image->path, $newPath);
                $copy->images()->create([
                    'path' => $newPath,
                    'type' => $image->type,
                    'is_cover' => $image->is_cover,
                ]);
            }
        }

        AuditLog::record($request->user(), 'event.duplicated', $copy, 'Event duplicated as draft.', [
            'source_event_id' => $event->id,
        ]);

        return response()->json([
            'message' => 'Event duplicated as draft.',
            'event' => new EventResource($copy->fresh()->load(['organizer.role', 'organizer.profile', 'category', 'categories', 'region', 'division', 'city', 'images'])),
        ], 201);
    }

    public function exportAttendees(Request $request, Event $event): StreamedResponse
    {
        if (! $request->user()->hasRole('admin') && (int) $event->organizer_id !== (int) $request->user()->id) {
            abort(403, 'You do not have permission to export attendees for this event.');
        }

        AuditLog::record($request->user(), 'event.attendees.exported', $event, 'Attendee CSV was exported.');

        $fileName = 'attendees-event-'.$event->id.'.csv';

        return response()->streamDownload(function () use ($event) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Name', 'Email', 'Phone', 'City', 'Ticket', 'Status', 'Registered At', 'Checked In At']);

            $event->registrations()
                ->with(['user.profile'])
                ->latest()
                ->chunk(200, function ($registrations) use ($handle) {
                    foreach ($registrations as $registration) {
                        fputcsv($handle, [
                            $registration->user?->name,
                            $registration->user?->email,
                            $registration->user?->profile?->phone,
                            $registration->user?->profile?->city,
                            $registration->ticket_number,
                            $registration->status,
                            optional($registration->registered_at)->toDateTimeString(),
                            optional($registration->checked_in_at)->toDateTimeString(),
                        ]);
                    }
                });

            fclose($handle);
        }, $fileName, ['Content-Type' => 'text/csv']);
    }

    public function myEvents(Request $request): JsonResponse
    {
        $events = Event::query()
            ->where('organizer_id', $request->user()->id)
            ->with(['category', 'region', 'division', 'city', 'images'])
            ->withCount(['registrations', 'bookmarks', 'reports'])
            ->latest()
            ->paginate(min((int) $request->input('per_page', 12), 50));

        return response()->json(['events' => EventResource::collection($events)]);
    }

    public function attendees(Request $request, Event $event): JsonResponse
    {
        if (! $request->user()->hasRole('admin') && (int) $event->organizer_id !== (int) $request->user()->id) {
            abort(403, 'You do not have permission to view attendees for this event.');
        }

        $registrations = $event->registrations()->with(['user.role', 'user.profile', 'checkedInBy.role', 'checkedInBy.profile'])->latest()->paginate(min((int) $request->input('per_page', 25), 100));
        $confirmedCount = $event->registrations()->where('status', 'confirmed')->count();
        $cancelledCount = $event->registrations()->whereIn('status', ['cancelled_by_user', 'cancelled_by_event', 'cancelled'])->count();
        $checkedInCount = $event->registrations()->whereNotNull('checked_in_at')->count();

        return response()->json([
            'event' => new EventResource($event->load(['category', 'region', 'division', 'city'])->loadCount(['registrations'])),
            'summary' => [
                'registrations_count' => $event->registrations()->count(),
                'confirmed_count' => $confirmedCount,
                'cancelled_count' => $cancelledCount,
                'checked_in_count' => $checkedInCount,
                'capacity' => $event->maximum_participants,
                'available_places' => $event->maximum_participants ? max(0, $event->maximum_participants - $confirmedCount) : null,
            ],
            'attendees' => RegistrationResource::collection($registrations),
        ]);
    }

    public function updateStatus(Request $request, Event $event): JsonResponse
    {
        if (! $request->user()->hasRole('admin')) {
            abort(403, 'Only administrators can moderate events.');
        }

        $validated = $request->validate([
            'status' => ['required', 'in:draft,pending,published,rejected,cancelled'],
            'moderation_reason' => ['nullable', 'required_if:status,rejected,cancelled', 'string', 'max:1000'],
        ]);

        $wasAvailable = $event->status === 'published' && $event->visibility === 'public';
        $event->update(['status' => $validated['status']]);
        $event->refresh();
        try {
            $this->handleAvailabilityTransition($event, $wasAvailable);
        } catch (Throwable $exception) {
            Log::warning('Event availability side effects failed.', [
                'event_id' => $event->id,
                'status' => $event->status,
                'error' => $exception->getMessage(),
            ]);
        }

        try {
            $event->loadMissing('organizer');
            if ($event->organizer) {
                $event->organizer->notify(new EventOrganizerModerationNotification($event->fresh(), $event->status, $validated['moderation_reason'] ?? null));
            }
        } catch (Throwable $exception) {
            Log::warning('Organizer moderation notification failed.', [
                'event_id' => $event->id,
                'organizer_id' => $event->organizer_id,
                'status' => $event->status,
                'error' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Event status updated successfully.',
            'event' => new EventResource($event->fresh()->load(['organizer.role', 'category', 'region', 'division', 'city'])),
        ]);
    }

    private function recordUniqueView(Event $event, Request $request): void
    {
        $user = $request->user();
        $visitorKey = $user ? 'user:'.$user->id : 'guest:'.sha1($request->ip().'|'.substr((string) $request->userAgent(), 0, 255));

        $view = EventView::firstOrCreate(
            ['event_id' => $event->id, 'visitor_key' => $visitorKey],
            ['user_id' => $user?->id, 'ip_address' => $request->ip(), 'user_agent' => $request->userAgent(), 'viewed_at' => now()]
        );

        if ($view->wasRecentlyCreated) {
            $event->increment('views');
        }
    }

    private function handleAvailabilityTransition(Event $event, bool $wasAvailable): void
    {
        $isAvailable = $event->status === 'published' && $event->visibility === 'public';

        if ($isAvailable && ! $wasAvailable) {
            $this->handleEventAvailable($event);
            SendEventInterestNotificationsJob::dispatch($event->id);
            return;
        }

        if (! $isAvailable && $wasAvailable) {
            $this->handleEventUnavailable($event);
        }
    }

    private function handleEventAvailable(Event $event): void
    {
        $event->loadMissing(['category', 'region', 'city', 'registrations.user']);

        foreach ($event->registrations as $registration) {
            if ($registration->status === 'cancelled_by_event') {
                $registration->update(['status' => 'confirmed']);
                $registration->user?->notify(new EventAvailableNotification($event));
            }
        }
    }

    private function handleEventUnavailable(Event $event, ?string $forcedReason = null): void
    {
        $event->loadMissing(['category', 'region', 'city', 'registrations.user']);
        $event->bookmarks()->delete();

        $reason = $forcedReason ?: match (true) {
            $event->status === 'cancelled' => 'cancelled',
            $event->status === 'rejected' => 'rejected',
            $event->visibility !== 'public' => 'private',
            default => 'unpublished',
        };

        foreach ($event->registrations as $registration) {
            if (! in_array($registration->status, ['cancelled', 'cancelled_by_event', 'cancelled_by_user'], true)) {
                $registration->update(['status' => 'cancelled_by_event']);
            }
            $registration->user?->notify(new EventUnavailableNotification($event, $reason));
        }
    }

    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(fn ($subQuery) => $subQuery->where('title', 'like', "%{$keyword}%")->orWhere('description', 'like', "%{$keyword}%")->orWhere('venue', 'like', "%{$keyword}%"));
        }

        foreach (['category_id', 'region_id', 'division_id', 'city_id', 'organizer_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        if ($request->filled('price')) {
            if ($request->input('price') === 'free') $query->where('price', 0);
            if ($request->input('price') === 'paid') $query->where('price', '>', 0);
        }

        if ($request->filled('date')) {
            match ($request->input('date')) {
                'today' => $query->whereDate('start_date', today()),
                'week' => $query->whereBetween('start_date', [now(), now()->addWeek()]),
                'month' => $query->whereBetween('start_date', [now(), now()->addMonth()]),
                'upcoming' => $query->where('start_date', '>=', now()),
                default => null,
            };
        }
    }

    private function applySorting($query, Request $request): void
    {
        match ($request->input('sort', 'upcoming')) {
            'latest' => $query->orderByDesc('start_date'),
            'popular' => $query->orderByDesc('views')->orderByDesc('registrations_count'),
            'price_low' => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            default => $query->orderBy('start_date'),
        };
    }

    private function syncCategories(Event $event, array $validated): void
    {
        $categoryIds = $validated['category_ids'] ?? [];
        $categoryIds[] = $validated['category_id'];
        $event->categories()->sync(array_unique($categoryIds));
    }

    private function syncImages(Event $event, array $images): void
    {
        foreach ($images as $image) {
            $event->images()->create(['path' => $image['path'], 'type' => $image['type'] ?? 'gallery', 'is_cover' => $image['is_cover'] ?? false]);
        }
    }
}
