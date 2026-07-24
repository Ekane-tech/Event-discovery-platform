<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Notifications\EventReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SendEventReminders extends Command
{
    protected $signature = 'events:send-reminders';

    protected $description = 'Send 24h and 1h event reminder notifications to registered attendees.';

    public function handle(): int
    {
        $now = now();

        // 24h reminders: events starting in 23–25 hours.
        $this->sendRemindersForWindow($now->copy()->addHours(23), $now->copy()->addHours(25), '24h');

        // 1h reminders: events starting in 30–90 minutes.
        $this->sendRemindersForWindow($now->copy()->addMinutes(30), $now->copy()->addMinutes(90), '1h');

        return self::SUCCESS;
    }

    protected function sendRemindersForWindow($from, $to, string $when): void
    {
        $events = Event::query()
            ->where('status', 'published')
            ->whereBetween('start_date', [$from, $to])
            ->with(['city', 'region'])
            ->get();

        foreach ($events as $event) {
            $cacheKey = "reminders:{$event->id}:{$when}";
            if (Cache::has($cacheKey)) {
                continue;
            }

            $registrations = $event->registrations()
                ->whereIn('status', ['confirmed'])
                ->with('user')
                ->get();

            $sent = 0;
            foreach ($registrations as $registration) {
                if ($registration->user) {
                    $registration->user->notify(new EventReminderNotification($event, $when));
                    $sent++;
                }
            }

            Cache::put($cacheKey, true, now()->addHours(26));
            $this->info("Sent {$when} reminder for '{$event->title}' to {$sent} attendee(s).");
        }
    }
}
