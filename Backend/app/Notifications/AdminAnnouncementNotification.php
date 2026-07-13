<?php

namespace App\Notifications;

use App\Models\AdminAnnouncement;
use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminAnnouncementNotification extends Notification implements ShouldQueue
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public AdminAnnouncement $announcement)
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
            ->subject($this->announcement->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line($this->announcement->message)
            ->action('Open notifications', $this->frontendUrl('/notifications'))
            ->line('You received this because platform announcements are enabled for your account.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->announcement->title,
            'message' => $this->announcement->message,
            'announcement_id' => $this->announcement->id,
            'audience' => $this->announcement->audience,
            'notification_kind' => 'admin_announcement',
        ];
    }
}
