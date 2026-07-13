<?php

namespace App\Notifications;

use App\Models\AppFeedback;
use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppFeedbackSubmittedNotification extends Notification
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public AppFeedback $feedback)
    {
        // Sent immediately so admins see new feedback without a queue worker.
    }

    public function via(object $notifiable): array
    {
        return $this->channelsFor($notifiable, 'admin_messages');
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New platform feedback')
            ->greeting('Hello '.$notifiable->name.',')
            ->line(($this->feedback->name ?: 'A visitor').' submitted '.$this->feedback->rating.'/5 feedback.')
            ->line($this->feedback->message)
            ->action('Review feedback', $this->frontendUrl('/admin/feedback'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New platform feedback',
            'message' => ($this->feedback->name ?: 'A user').' submitted '.$this->feedback->rating.'/5 feedback.',
            'feedback_id' => $this->feedback->id,
            'rating' => $this->feedback->rating,
            'category' => $this->feedback->category,
            'feedback_status' => $this->feedback->status,
            'notification_kind' => 'app_feedback_submitted',
        ];
    }
}
