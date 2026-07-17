<?php

namespace App\Notifications;

use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public string $status, public ?string $reason = null)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return $this->channelsFor($notifiable, 'admin_messages');
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your account status has been updated')
            ->view('emails.user-status-changed', [
                'name' => $notifiable->name,
                'status' => $this->status,
                'reason' => $this->reason,
                'url' => $this->status === 'active' ? $this->frontendUrl('/login') : 'mailto:'.env('SUPPORT_EMAIL', 'support@mboaevents237.cm'),
                'ctaLabel' => $this->status === 'active' ? 'Sign in' : 'Contact support',
                'supportEmail' => env('SUPPORT_EMAIL', 'support@mboaevents237.cm'),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Account status updated',
            'message' => 'Your account status is now '.$this->status.'.',
            'status' => $this->status,
            'reason' => $this->reason,
            'notification_kind' => 'user_status_changed',
        ];
    }
}
