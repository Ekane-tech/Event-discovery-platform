<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'interest_matches' => ['required', 'boolean'],
            'event_reminders' => ['required', 'boolean'],
            'organizer_announcements' => ['required', 'boolean'],
            'admin_messages' => ['required', 'boolean'],
            'database' => ['required', 'boolean'],
            'email' => ['required', 'boolean'],
            'sms' => ['required', 'boolean'],
            'push' => ['required', 'boolean'],
        ];
    }
}
