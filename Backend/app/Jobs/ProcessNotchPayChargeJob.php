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
 * Background charge for a NotchPay mobile-money payment.
 *
 * Why this exists:
 *   The user clicks "Pay" and we MUST return instantly with
 *   "Check your phone" — but the actual charge call to NotchPay
 *   takes 5-30 seconds (it waits for the user to approve the
 *   prompt on their phone). So the API endpoint just *initializes*
 *   the payment and dispatches THIS job, which does the slow part.
 *
 * Lifecycle:
 *   1. Controller POST /payments/{id}/initiate
 *      → MobileMoneyPaymentService::initiate()  (fast: only /payments)
 *      → status = "processing", external_reference set
 *      → dispatch(ProcessNotchPayChargeJob)
 *      → return 202
 *   2. THIS JOB runs in the worker
 *      → POST /payments/{ref} with channel=cm.mtn
 *      → save provider_reference + status (still "processing" usually)
 *   3. User approves prompt on phone
 *   4. NotchPay fires webhook → ProcessNotchPayWebhookJob
 *      → final status flip → email fires
 *
 * Retry behaviour:
 *   - 5 attempts with exponential backoff (1s, 5s, 30s, 2m, 10m)
 *   - The job's $timeout (120s) is below the worker's --timeout (130s)
 *     so the worker never kills us mid-write.
 */
class ProcessNotchPayChargeJob implements ShouldQueue
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
            Log::warning('ProcessNotchPayChargeJob: payment row not found.', [
                'payment_id' => $this->paymentId,
            ]);
            return;
        }

        // Already finalized (webhook beat us, or a previous attempt finished).
        // Don't re-charge.
        if (in_array($payment->status, ['paid', 'failed', 'refunded', 'cancelled'], true)) {
            Log::info('ProcessNotchPayChargeJob: skipping, payment already final.', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ]);
            return;
        }

        $operator = (string) ($payment->metadata['operator'] ?? '');
        $phone = (string) ($payment->phone_number ?? '');

        if ($operator === '' || $phone === '') {
            Log::error('ProcessNotchPayChargeJob: missing operator or phone.', [
                'payment_id' => $payment->id,
            ]);
            return; // do not retry — the row is misconfigured
        }

        try {
            $service->chargeNotchPay($payment, $operator, $phone);
        } catch (Throwable $e) {
            Log::error('ProcessNotchPayChargeJob: charge threw, will retry.', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e; // trigger retry
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::error('ProcessNotchPayChargeJob: permanently failed after all retries.', [
            'payment_id' => $this->paymentId,
            'error' => $exception->getMessage(),
        ]);
    }
}
