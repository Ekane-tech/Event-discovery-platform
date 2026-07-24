<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'organization_name',
        'is_verified_organizer',
        'phone',
        'city',
        'region',
        'avatar',
        'bio',
        'preferred_language',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
