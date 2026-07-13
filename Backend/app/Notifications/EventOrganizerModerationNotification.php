<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventOrganizerModerationNotification extends Notification
{
    use Queueable;

    public function __construct(public Event $event, public string $status, public ?string $reason = null)
    {
        // This notification is intentionally not queued so organizer moderation feedback is visible immediately.
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $title = $this->status === 'published'
            ? 'Your event has been published'
            : 'Your event status has changed';

        $message = $this->status === 'published'
            ? $this->event->title.' has been published and is visible to users again.'
            : $this->event->title.' is now '.$this->status.'.';

        return [
            'title' => $title,
            'message' => $message,
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'status' => $this->status,
            'reason' => $this->reason,
            'notification_kind' => 'organizer_event_moderation',
        ];
    }
}
