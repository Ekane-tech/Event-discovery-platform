<?php

namespace App\Notifications;

use App\Models\AppFeedback;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppFeedbackSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(public AppFeedback $feedback)
    {
        // Sent immediately so admins see new feedback without a queue worker.
    }

    public function via(object $notifiable): array
    {
        return ['database'];
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
