<?php

namespace App\Notifications;

use App\Models\Event;
use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventReminderNotification extends Notification implements ShouldQueue
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public Event $event, public string $when = 'soon')
    {
        // $when: '24h' or '1h'
    }

    public function via(object $notifiable): array
    {
        return $this->channelsFor($notifiable, 'event_reminders');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $is24h = $this->when === '24h';

        return (new MailMessage)
            ->subject($is24h
                ? 'Reminder: '.$this->event->title.' is tomorrow'
                : 'Starting soon: '.$this->event->title)
            ->greeting('Hi '.$notifiable->name.',')
            ->line($is24h
                ? 'This is a friendly reminder that "'.$this->event->title.'" is happening tomorrow.'
                : '"'.$this->event->title.'" is starting soon!')
            ->line('**When:** '.$this->event->start_date?->format('l, F j, Y \a\t g:i A'))
            ->line('**Where:** '.trim(($this->event->venue ? $this->event->venue.', ' : '').($this->event->city?->name ?? '').', '.($this->event->region?->name ?? ''), ', '))
            ->action('View your ticket', $this->frontendUrl('/tickets/'.$this->event->id))
            ->line('Don\'t forget to bring your ticket (QR code) for check-in.');
    }

    public function toArray(object $notifiable): array
    {
        $is24h = $this->when === '24h';

        return [
            'title' => $is24h ? 'Event tomorrow' : 'Event starting soon',
            'message' => ($is24h ? 'Tomorrow: ' : 'Starting soon: ').$this->event->title,
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'city' => $this->event->city?->name,
            'region' => $this->event->region?->name,
            'start_date' => $this->event->start_date?->toISOString(),
            'notification_kind' => 'reminder',
        ];
    }
}
