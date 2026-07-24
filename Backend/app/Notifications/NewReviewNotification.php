<?php

namespace App\Notifications;

use App\Models\EventReview;
use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewReviewNotification extends Notification implements ShouldQueue
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public EventReview $review)
    {
    }

    // Non-transactional — respect the organizer's general database/email preferences.
    public function via(object $notifiable): array
    {
        return $this->channelsFor($notifiable);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $event = $this->review->event;

        $mail = (new MailMessage)
            ->subject('New review for '.$event?->title)
            ->greeting('Hi '.$notifiable->name.',')
            ->line(($this->review->user?->name ?? 'An attendee').' left a '.$this->review->rating.'-star review for "'.$event?->title.'".');

        if ($this->review->comment) {
            $mail->line('“'.$this->review->comment.'”');
        }

        return $mail->action('View event', $this->frontendUrl('/events/'.$event?->id));
    }

    public function toArray(object $notifiable): array
    {
        $event = $this->review->event;

        return [
            'title' => 'New review received',
            'message' => ($this->review->user?->name ?? 'An attendee').' rated "'.$event?->title.'" '.$this->review->rating.'/5.',
            'event_id' => $event?->id,
            'event_title' => $event?->title,
            'rating' => $this->review->rating,
            'notification_kind' => 'new_review',
        ];
    }
}
