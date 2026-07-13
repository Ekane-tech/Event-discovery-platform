<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'event_id', 'registration_id', 'amount', 'currency', 'status', 'provider',
        'operator', 'phone_number', 'reference', 'external_reference', 'provider_reference',
        'failure_reason', 'callback_payload', 'metadata', 'initiated_at', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'metadata' => 'array',
            'callback_payload' => 'array',
            'initiated_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function registration()
    {
        return $this->belongsTo(Registration::class);
    }
}
