<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Region extends Model
{
    use HasFactory;

    protected $fillable = [
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
        static::saving(function (Region $region) {
            if (! $region->slug && $region->name) {
                $region->slug = Str::slug($region->name);
            }
        });
    }

    public function divisions()
    {
        return $this->hasMany(Division::class);
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
