<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function interests()
    {
        return $this->belongsToMany(Interest::class, 'user_interests')->withTimestamps();
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function bookmarkedEvents()
    {
        return $this->belongsToMany(Event::class, 'bookmarks')->withTimestamps();
    }

    public function registrations()
    {
        return $this->hasMany(Registration::class);
    }

    public function registeredEvents()
    {
        return $this->belongsToMany(Event::class, 'registrations')
            ->withPivot(['status', 'ticket_number', 'registered_at'])
            ->withTimestamps();
    }

    public function notificationPreference()
    {
        return $this->hasOne(NotificationPreference::class);
    }

    public function notificationPreferences()
    {
        return $this->notificationPreference()->firstOrCreate([]);
    }

    public function hasRole(string $role): bool
    {
        return $this->role?->name === $role;
    }
}
