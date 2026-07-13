<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'path',
        'type',
        'is_cover',
    ];

    protected function casts(): array
    {
        return [
            'is_cover' => 'boolean',
        ];
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
