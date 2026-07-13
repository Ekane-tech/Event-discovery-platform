<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationPreferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'interest_matches' => (bool) $this->interest_matches,
            'event_reminders' => (bool) $this->event_reminders,
            'organizer_announcements' => (bool) $this->organizer_announcements,
            'admin_messages' => (bool) $this->admin_messages,
            'database' => (bool) $this->database,
            'email' => (bool) $this->email,
            'sms' => (bool) $this->sms,
            'push' => (bool) $this->push,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
