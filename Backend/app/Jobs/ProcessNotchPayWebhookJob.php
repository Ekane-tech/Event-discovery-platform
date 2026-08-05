<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Services\Payments\MobileMoneyPaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Async handler for NotchPay webhook deliveries.
 *
 * The HTTP endpoint (POST /api/payments/callback/notchpay) does
 * nothing but: verify signature, enqueue this job, respond 200.
 * All DB writes and email side-effects happen here, in the worker.
 *
 * Idempotency: the underlying service uses the Payment model's
 * `wasChanged('status')` guard so duplicate deliveries (NotchPay
 * does retry) won't re-credit or re-email the user.
 */
class ProcessNotchPayWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    /** @var array<int, int> */
    public array $backoff = [1, 5, 30, 120, 600];

    public int $timeout = 120;

    public function __construct(
        public string $reference,
        public array $payload,
        public string $eventType,
    ) {
    }

    public function handle(MobileMoneyPaymentService $service): void
    {
        $payment = Payment::query()
            ->where('reference', $this->reference)
            ->orWhere('external_reference', $this->reference)
            ->orWhere('provider_reference', $this->reference)
            ->first();

        if (! $payment) {
            Log::warning('ProcessNotchPayWebhookJob: payment not found for webhook reference.', [
                'reference' => $this->reference,
                'event' => $this->eventType,
            ]);
            return; // don't retry — stale or attack
        }

        // Already in a terminal state on a duplicate payment.complete?
        // Skip — Payment model's wasChanged('status') would block re-credit anyway.
        if (in_array($payment->status, ['paid', 'refunded', 'cancelled'], true)
            && $this->eventType === 'payment.complete') {
            Log::info('ProcessNotchPayWebhookJob: duplicate payment.complete, ignoring.', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ]);
            return;
        }

        try {
            $service->applyProviderStatus($payment, $this->payload, 'callback');
        } catch (Throwable $e) {
            Log::error('ProcessNotchPayWebhookJob: applyProviderStatus threw, will retry.', [
                'payment_id' => $payment->id,
                'event' => $this->eventType,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::error('ProcessNotchPayWebhookJob: permanently failed after all retries.', [
            'reference' => $this->reference,
            'event' => $this->eventType,
            'error' => $exception->getMessage(),
        ]);
    }
}
