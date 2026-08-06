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
 * Background charge for a MeSomb mobile-money payment.
 *
 * Why this exists:
 *   The user clicks "Pay" and we MUST return instantly with
 *   "Check your phone and confirm the prompt" — so the API endpoint only
 *   marks the payment "processing" and dispatches THIS job. The job calls
 *   MeSomb makeCollect() in asynchronous mode, which pushes the prompt to
 *   the user's phone and returns in ~1-2s (the waiting for the user's
 *   confirmation happens on MeSomb's side, not in our worker).
 *
 * Lifecycle:
 *   1. Controller POST /payments/{id}/initiate
 *      → MobileMoneyPaymentService::initiate()  (fast, no external calls)
 *      → status = "processing", dispatch(ProcessMeSombChargeJob)
 *      → return 202 "Check your phone..."
 *   2. THIS JOB runs in the worker
 *      → MeSomb makeCollect(async) → status PENDING, transaction pk saved
 *   3. User approves the prompt on their phone
 *   4. MeSomb fires webhook → ProcessMeSombWebhookJob
 *      → final status flip → organizer wallet credit + confirmation email
 *
 * Retry behaviour:
 *   - 5 attempts with exponential backoff (1s, 5s, 30s, 2m, 10m)
 *   - Idempotent: MobileMoneyPaymentService::chargeMeSomb() skips payments
 *     that were already charged (charge_completed_at) or already finalized,
 *     so a retried job never pushes a second prompt.
 *   - The job's $timeout (120s) is below the worker's --timeout (130s)
 *     so the worker never kills us mid-write.
 */
class ProcessMeSombChargeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    /** @var array<int, int> */
    public array $backoff = [1, 5, 30, 120, 600];

    public int $timeout = 120;

    public function __construct(public int $paymentId)
    {
    }

    public function handle(MobileMoneyPaymentService $service): void
    {
        $payment = Payment::find($this->paymentId);

        if (! $payment) {
            Log::warning('ProcessMeSombChargeJob: payment row not found.', [
                'payment_id' => $this->paymentId,
            ]);
            return;
        }

        // Already finalized (webhook beat us, or a previous attempt finished).
        // Don't re-charge.
        if (in_array($payment->status, ['paid', 'failed', 'refunded', 'cancelled'], true)) {
            Log::info('ProcessMeSombChargeJob: skipping, payment already final.', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ]);
            return;
        }

        $operator = (string) ($payment->metadata['operator'] ?? '');
        $phone = (string) ($payment->phone_number ?? '');

        if ($operator === '' || $phone === '') {
            Log::error('ProcessMeSombChargeJob: missing operator or phone.', [
                'payment_id' => $payment->id,
            ]);
            return; // do not retry — the row is misconfigured
        }

        try {
            $service->chargeMeSomb($payment, $operator, $phone);
        } catch (Throwable $e) {
            Log::error('ProcessMeSombChargeJob: charge threw, will retry.', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e; // trigger retry
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::error('ProcessMeSombChargeJob: permanently failed after all retries.', [
            'payment_id' => $this->paymentId,
            'error' => $exception->getMessage(),
        ]);

        // The webhook will never come for a payment that could not be
        // charged — flip it to failed so the user can retry instead of
        // hanging in "processing" forever.
        try {
            $payment = Payment::find($this->paymentId);

            if ($payment && in_array($payment->status, ['pending', 'processing'], true)) {
                $payment->update([
                    'status' => 'failed',
                    'failure_reason' => 'The payment could not be completed. Please try again.',
                    'metadata' => [
                        ...($payment->metadata ?? []),
                        'charge_job_failed_at' => now()->toISOString(),
                        'charge_job_error' => $exception->getMessage(),
                    ],
                ]);
            }
        } catch (Throwable $e) {
            Log::warning('ProcessMeSombChargeJob: failed to mark payment as failed.', [
                'payment_id' => $this->paymentId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
