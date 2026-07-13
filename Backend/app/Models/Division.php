<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'region_id',
        'name',
        'slug',
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
        static::saving(function (Division $division) {
            if (! $division->slug && $division->name) {
                $division->slug = Str::slug($division->name);
            }
        });
    }

    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    public function cities()
    {
        return $this->hasMany(City::class);
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }
}
