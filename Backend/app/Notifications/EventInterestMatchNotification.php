<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventInterestMatchNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Event $event)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New event matching your interests')
            ->line('A new event matches your interests: '.$this->event->title)
            ->action('View Event', url('/events/'.$this->event->id));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New event matching your interests',
            'message' => $this->event->title.' matches your event interests.',
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'category_id' => $this->event->category_id,
            'category_name' => $this->event->category?->name,
            'city_id' => $this->event->city_id,
            'city_name' => $this->event->city?->name,
            'region_id' => $this->event->region_id,
            'region_name' => $this->event->region?->name,
            'start_date' => $this->event->start_date?->toISOString(),
            'notification_kind' => 'interest_match',
        ];
    }
}
