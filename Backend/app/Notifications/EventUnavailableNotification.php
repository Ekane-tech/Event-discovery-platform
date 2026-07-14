<?php

namespace App\Notifications;

use App\Models\Event;
use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventUnavailableNotification extends Notification implements ShouldQueue
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public Event $event, public string $reason = 'updated')
    {
        //
    }

    public function via(object $notifiable): array
    {
        return $this->channelsFor($notifiable, 'event_reminders');
    }

    private function reasonText(): string
    {
        return match ($this->reason) {
            'cancelled' => 'has been cancelled',
            'private' => 'is no longer public',
            'unpublished' => 'is no longer published',
            'rejected' => 'has been rejected',
            default => 'is no longer available',
        };
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Event update')
            ->view('emails.event-unavailable', [
                'name' => $notifiable->name,
                'eventTitle' => $this->event->title,
                'reasonText' => $this->reasonText(),
                'url' => $this->frontendUrl('/events'),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $reasonText = match ($this->reason) {
            'cancelled' => 'has been cancelled',
            'private' => 'is no longer public',
            'unpublished' => 'is no longer published',
            'rejected' => 'has been rejected',
            default => 'is no longer available',
        };

        return [
            'title' => 'Event update',
            'message' => $this->event->title.' '.$reasonText.'.',
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'status' => $this->event->status,
            'visibility' => $this->event->visibility,
            'category_id' => $this->event->category_id,
            'category_name' => $this->event->category?->name,
            'city_id' => $this->event->city_id,
            'city_name' => $this->event->city?->name,
            'region_id' => $this->event->region_id,
            'region_name' => $this->event->region?->name,
            'start_date' => $this->event->start_date?->toISOString(),
            'notification_kind' => 'event_unavailable',
        ];
    }
}
