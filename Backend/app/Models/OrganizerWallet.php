<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrganizerWallet extends Model
{
    protected $fillable = [
        'user_id',
        'currency',
        'payout_method',
        'payout_details',
    ];

    protected $casts = [
        'payout_details' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class, 'organizer_id', 'user_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'organizer_id', 'user_id');
    }
}
