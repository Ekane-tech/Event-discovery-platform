<?php

namespace App\Notifications;

use App\Models\Event;
use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationConfirmedNotification extends Notification implements ShouldQueue
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public Event $event, public string $ticketNumber)
    {
    }

    // Transactional — always send via mail + database regardless of preferences.
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Registration confirmed: '.$this->event->title)
            ->greeting('Hi '.$notifiable->name.',')
            ->line('Your registration for "'.$this->event->title.'" is confirmed!')
            ->line('**Ticket number:** '.$this->ticketNumber)
            ->line('**Date:** '.$this->event->start_date?->format('l, F j, Y \a\t g:i A'))
            ->line('**Location:** '.trim(($this->event->venue ? $this->event->venue.', ' : '').($this->event->city?->name ?? '').', '.($this->event->region?->name ?? ''), ', '))
            ->action('View your ticket', $this->frontendUrl('/tickets/'.$this->event->id))
            ->line('We look forward to seeing you at the event!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Registration confirmed',
            'message' => 'Your registration for "'.$this->event->title.'" is confirmed. Ticket: '.$this->ticketNumber,
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'city' => $this->event->city?->name,
            'region' => $this->event->region?->name,
            'start_date' => $this->event->start_date?->toISOString(),
            'notification_kind' => 'registration_confirmed',
        ];
    }
}
