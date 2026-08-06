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
 * Async handler for MeSomb webhook deliveries.
 *
 * The HTTP endpoint (POST /api/payments/callback/mesomb) does nothing but:
 * verify the X-MeSomb-Webhook-Signature HMAC, extract the reference, enqueue
 * this job, respond 200. All DB writes and email side-effects happen here,
 * in the worker.
 *
 * Idempotency (MeSomb retries deliveries for up to 72h):
 *   - duplicate MeSomb event ids are recorded in the payment metadata and
 *     skipped;
 *   - the underlying service uses the Payment model's wasChanged('status')
 *     guard, so a re-delivered event can never re-credit the organizer
 *     wallet or re-send the confirmation email;
 *   - applyProviderStatus() only sets paid_at on the first transition.
 */
class ProcessMeSombWebhookJob implements ShouldQueue
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
            Log::warning('ProcessMeSombWebhookJob: payment not found for webhook reference.', [
                'reference' => $this->reference,
                'event' => $this->eventType,
            ]);
            return; // don't retry — stale or attack
        }

        $eventId = (string) ($this->payload['id'] ?? '');

        // Deduplicate: MeSomb may deliver the same event more than once.
        if ($eventId !== '') {
            $processed = (array) ($payment->metadata['webhook_event_ids'] ?? []);

            if (in_array($eventId, $processed, true)) {
                Log::info('ProcessMeSombWebhookJob: duplicate webhook event, ignoring.', [
                    'payment_id' => $payment->id,
                    'event_id' => $eventId,
                ]);
                return;
            }
        }

        // Already in a terminal state on a success event? Skip — the
        // wasChanged('status') guard would block re-credit anyway.
        if (in_array($payment->status, ['paid', 'refunded', 'cancelled'], true)
            && str_contains(strtolower($this->eventType), 'success')) {
            Log::info('ProcessMeSombWebhookJob: duplicate success event, ignoring.', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ]);
            return;
        }

        try {
            $service->applyProviderStatus($payment, $this->payload, 'callback');
        } catch (Throwable $e) {
            Log::error('ProcessMeSombWebhookJob: applyProviderStatus threw, will retry.', [
                'payment_id' => $payment->id,
                'event' => $this->eventType,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }

        // Record the event id only AFTER successful processing — if the job
        // retries, applyProviderStatus() is idempotent anyway.
        if ($eventId !== '') {
            try {
                $payment->refresh();
                $processed = (array) ($payment->metadata['webhook_event_ids'] ?? []);

                if (! in_array($eventId, $processed, true)) {
                    $processed[] = $eventId;
                    $payment->update([
                        'metadata' => [
                            ...($payment->metadata ?? []),
                            'webhook_event_ids' => array_slice($processed, -50),
                        ],
                    ]);
                }
            } catch (Throwable $e) {
                Log::warning('ProcessMeSombWebhookJob: failed to record event id.', [
                    'payment_id' => $payment->id,
                    'event_id' => $eventId,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::error('ProcessMeSombWebhookJob: permanently failed after all retries.', [
            'reference' => $this->reference,
            'event' => $this->eventType,
            'error' => $exception->getMessage(),
        ]);
    }
}
