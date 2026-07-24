<?php

namespace App\Services\Wallet;

use App\Models\OrganizerWallet;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletService
{
    public function feePercent(): float
    {
        return PlatformSetting::getFloat('platform_fee_percent', 5.0);
    }

    public function graceHours(): int
    {
        return PlatformSetting::getInt('payout_grace_hours', 48);
    }

    public function minPayout(): float
    {
        return PlatformSetting::getFloat('min_payout_amount', 10000.0);
    }

    public function currency(): string
    {
        return (string) (PlatformSetting::get('payout_currency', 'XAF'));
    }

    public function ensureWallet(User $organizer): OrganizerWallet
    {
        return OrganizerWallet::firstOrCreate(
            ['user_id' => $organizer->id],
            ['currency' => $this->currency()],
        );
    }

    /**
     * Credit the organizer of a paid event's payment. Idempotent.
     */
    public function creditOnPayment(Payment $payment): ?WalletTransaction
    {
        return DB::transaction(function () use ($payment) {
            $payment->loadMissing(['event.organizer']);

            $organizer = $payment->event?->organizer;

            if (! $organizer) {
                Log::info('Wallet credit skipped: event has no organizer.', ['payment_id' => $payment->id]);

                return null;
            }

            // Idempotency: never credit the same payment twice.
            $exists = WalletTransaction::where('payment_id', $payment->id)
                ->where('type', 'credit')
                ->exists();

            if ($exists) {
                return null;
            }

            $this->ensureWallet($organizer);

            $feePercent = $this->feePercent();
            $gross = (float) $payment->amount;
            $fee = round($gross * ($feePercent / 100), 2);
            $net = round(max(0, $gross - $fee), 2);

            return WalletTransaction::create([
                'organizer_id' => $organizer->id,
                'type' => 'credit',
                'payment_id' => $payment->id,
                'event_id' => $payment->event_id,
                'gross' => $gross,
                'fee' => $fee,
                'net' => $net,
                'status' => 'held',
                'description' => 'Ticket sale'.($payment->event ? ': '.$payment->event->title : ''),
            ]);
        });
    }

    /**
     * Reverse an organizer's credit for a payment (refunds / disputes).
     */
    public function reverseCredit(Payment $payment): void
    {
        DB::transaction(function () use ($payment) {
            WalletTransaction::where('payment_id', $payment->id)
                ->where('type', 'credit')
                ->whereIn('status', ['held', 'released'])
                ->update([
                    'status' => 'reversed',
                    'description' => DB::raw("CONCAT(COALESCE(description, ''), ' (reversed)')"),
                ]);
        });
    }

    /**
     * Release held credits whose event ended more than the grace period ago
     * (and whose payment is still paid). Scoped to one organizer.
     */
    public function releaseHeldForOrganizer(User $organizer): int
    {
        return $this->releaseHeldQuery(
            WalletTransaction::where('organizer_id', $organizer->id)
        );
    }

    /**
     * Release all eligible held credits (used by the scheduled command).
     */
    public function releaseHeldFunds(): int
    {
        return $this->releaseHeldQuery(WalletTransaction::query());
    }

    protected function releaseHeldQuery($query): int
    {
        $cutoff = now()->subHours($this->graceHours());

        $credits = $query
            ->where('type', 'credit')
            ->where('status', 'held')
            ->whereHas('payment', fn ($q) => $q->where('status', 'paid'))
            ->whereHas('event', fn ($q) => $q->whereNotNull('end_date')->where('end_date', '<=', $cutoff))
            ->get();

        $now = now();
        $count = 0;

        foreach ($credits as $credit) {
            $credit->update(['status' => 'released', 'released_at' => $now]);
            $count++;
        }

        return $count;
    }

    /**
     * Compute wallet balances from the ledger + payouts.
     */
    public function balances(User $organizer): array
    {
        // Release any eligible held funds before computing.
        $this->releaseHeldForOrganizer($organizer);

        $releasedCredits = (float) WalletTransaction::where('organizer_id', $organizer->id)
            ->where('type', 'credit')
            ->where('status', 'released')
            ->sum('net');

        $heldCredits = (float) WalletTransaction::where('organizer_id', $organizer->id)
            ->where('type', 'credit')
            ->where('status', 'held')
            ->sum('net');

        $adjustments = (float) WalletTransaction::where('organizer_id', $organizer->id)
            ->where('type', 'adjustment')
            ->sum('net');

        $lifetime = (float) WalletTransaction::where('organizer_id', $organizer->id)
            ->where('type', 'credit')
            ->where('status', '!=', 'reversed')
            ->sum('net');

        $payoutsDeducted = (float) Payout::where('organizer_id', $organizer->id)
            ->whereIn('status', ['requested', 'approved', 'paid'])
            ->sum('amount');

        $totalPaidOut = (float) Payout::where('organizer_id', $organizer->id)
            ->where('status', 'paid')
            ->sum('amount');

        $pendingPayouts = (float) Payout::where('organizer_id', $organizer->id)
            ->whereIn('status', ['requested', 'approved'])
            ->sum('amount');

        $available = round($releasedCredits + $adjustments - $payoutsDeducted, 2);

        return [
            'currency' => $this->currency(),
            'available' => $available,
            'pending' => round($heldCredits, 2),
            'lifetime_earnings' => round($lifetime, 2),
            'total_paid_out' => round($totalPaidOut, 2),
            'pending_payouts' => round($pendingPayouts, 2),
        ];
    }

    public function requestPayout(User $organizer, array $data): Payout
    {
        return DB::transaction(function () use ($organizer, $data) {
            $balances = $this->balances($organizer);
            $amount = (float) $data['amount'];

            if ($amount < $this->minPayout()) {
                throw new \DomainException('Amount is below the minimum payout of '.$this->minPayout().' '.$this->currency().'.');
            }

            if ($amount > $balances['available']) {
                throw new \DomainException('Requested amount exceeds your available balance.');
            }

            $wallet = $this->ensureWallet($organizer);

            return Payout::create([
                'organizer_id' => $organizer->id,
                'amount' => $amount,
                'currency' => $this->currency(),
                'method' => $data['method'] ?? $wallet->payout_method ?? 'mobile_money',
                'destination' => $data['destination'] ?? $wallet->payout_details,
                'status' => 'requested',
            ]);
        });
    }

    public function approve(Payout $payout): Payout
    {
        if (! in_array($payout->status, ['requested'], true)) {
            throw new \DomainException('Only requested payouts can be approved.');
        }

        $payout->update(['status' => 'approved']);

        return $payout;
    }

    public function reject(Payout $payout, ?string $notes = null): Payout
    {
        if (! in_array($payout->status, ['requested', 'approved'], true)) {
            throw new \DomainException('This payout can no longer be rejected.');
        }

        $payout->update([
            'status' => 'rejected',
            'admin_notes' => $notes,
        ]);

        return $payout;
    }

    public function markPaid(Payout $payout, User $admin, ?string $reference = null): Payout
    {
        if (! in_array($payout->status, ['approved', 'requested'], true)) {
            throw new \DomainException('This payout cannot be marked as paid.');
        }

        $payout->update([
            'status' => 'paid',
            'reference' => $reference ?: 'PO-'.$payout->id.'-'.strtoupper(\Illuminate\Support\Str::random(8)),
            'processed_by' => $admin->id,
            'processed_at' => now(),
        ]);

        return $payout;
    }

    public function cancel(Payout $payout): Payout
    {
        if ($payout->status !== 'requested') {
            throw new \DomainException('Only pending payout requests can be cancelled.');
        }

        $payout->update(['status' => 'cancelled']);

        return $payout;
    }
}
