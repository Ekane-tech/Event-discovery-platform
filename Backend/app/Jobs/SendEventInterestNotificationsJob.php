<?php

namespace App\Jobs;

use App\Models\Event;
use App\Models\User;
use App\Notifications\EventInterestMatchNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendEventInterestNotificationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $eventId)
    {
        //
    }

    public function handle(): void
    {
        $event = Event::query()
            ->with(['category', 'region', 'city'])
            ->find($this->eventId);

        if (! $event || ! $event->category || $event->status !== 'published' || $event->visibility !== 'public') {
            return;
        }

        $categorySlug = $event->category->slug;
        $categoryName = $event->category->name;

        User::query()
            ->whereHas('role', fn ($query) => $query->where('name', 'user'))
            ->whereHas('notificationPreference', function ($query) {
                $query->where('database', true)->where('interest_matches', true);
            })
            ->whereHas('interests', function ($query) use ($categorySlug, $categoryName) {
                $query->where('slug', $categorySlug)
                    ->orWhere('name', $categoryName);
            })
            ->where('id', '!=', $event->organizer_id)
            ->chunkById(100, function ($users) use ($event) {
                foreach ($users as $user) {
                    try {
                        $user->notify(new EventInterestMatchNotification($event));
                    } catch (Throwable $exception) {
                        Log::warning('Event interest notification failed.', [
                            'event_id' => $event->id,
                            'user_id' => $user->id,
                            'error' => $exception->getMessage(),
                        ]);
                    }
                }
            });
    }
}
