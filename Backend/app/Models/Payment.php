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

    public function walletTransaction()
    {
        return $this->hasOne(WalletTransaction::class);
    }

    /**
     * Credit the organizer's wallet when a payment flips to 'paid', and reverse
     * it on refund/cancellation. Centralised here so every payment path
     * (controller + Campay service) is covered, idempotently.
     */
    protected static function booted(): void
    {
        static::updated(function (Payment $payment) {
            if (! $payment->wasChanged('status')) {
                return;
            }

            try {
                $walletService = app(\App\Services\Wallet\WalletService::class);

                if ($payment->status === 'paid') {
                    $walletService->creditOnPayment($payment);
                } elseif (in_array($payment->status, ['refunded', 'cancelled'], true)) {
                    $walletService->reverseCredit($payment);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Wallet hook failed for payment.', [
                    'payment_id' => $payment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        });
    }
}
