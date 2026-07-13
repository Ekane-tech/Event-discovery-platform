<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'interest_matches',
        'event_reminders',
        'organizer_announcements',
        'admin_messages',
        'database',
        'email',
        'sms',
        'push',
    ];

    protected function casts(): array
    {
        return [
            'interest_matches' => 'boolean',
            'event_reminders' => 'boolean',
            'organizer_announcements' => 'boolean',
            'admin_messages' => 'boolean',
            'database' => 'boolean',
            'email' => 'boolean',
            'sms' => 'boolean',
            'push' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
