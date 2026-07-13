<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Interest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Interest $interest) {
            if (! $interest->slug && $interest->name) {
                $interest->slug = Str::slug($interest->name);
            }
        });
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_interests')->withTimestamps();
    }
}
