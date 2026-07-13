<?php

namespace App\Notifications;

use App\Models\AdminAnnouncement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AdminAnnouncementNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public AdminAnnouncement $announcement)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['database'];
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
