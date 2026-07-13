<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_id',
        'event_id',
        'type',
        'message',
        'status',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }
}
