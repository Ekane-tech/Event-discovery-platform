<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'organizer_id',
        'type',
        'payment_id',
        'event_id',
        'gross',
        'fee',
        'net',
        'status',
        'released_at',
        'description',
    ];

    protected $casts = [
        'gross' => 'decimal:2',
        'fee' => 'decimal:2',
        'net' => 'decimal:2',
        'released_at' => 'datetime',
    ];

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
