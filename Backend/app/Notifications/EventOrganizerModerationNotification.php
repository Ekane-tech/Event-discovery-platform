<?php

namespace App\Notifications;

use App\Models\Event;
use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventOrganizerModerationNotification extends Notification
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public Event $event, public string $status, public ?string $reason = null)
    {
        // This notification is intentionally not queued so organizer moderation feedback is visible immediately.
    }

    public function via(object $notifiable): array
    {
        return $this->channelsFor($notifiable, 'organizer_announcements');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->status === 'published' ? 'Your event has been published' : 'Your event status has changed';
        $message = $this->status === 'published'
            ? $this->event->title.' has been published and is visible to users.'
            : $this->event->title.' is now '.$this->status.'.';

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting('Hello '.$notifiable->name.',')
            ->line($message);

        if ($this->reason) {
            $mail->line('Reason: '.$this->reason);
        }

        return $mail->action('Manage event', $this->frontendUrl('/organizer/events/'.$this->event->id.'/details'));
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
