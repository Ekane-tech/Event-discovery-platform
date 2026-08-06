<?php

namespace App\Services\Payments;

use App\Jobs\ProcessMeSombChargeJob;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Registration;
use App\Services\Payments\MeSomb\MeSombClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Payment service for Mboa Events 237.
 *
 * Supports two providers:
 *   - "mock"  : local development, no external calls
 *   - "mesomb": Cameroon mobile money (MTN / Orange) via MeSomb
 *               (https://mesomb.com — SDK: https://github.com/hachther/mesomb-php)
 *
 * The MeSomb flow keeps the same UX as the previous NotchPay integration:
 *
 *   1. initiate() — FAST (no external HTTP call at all, < 1s).
 *      Marks the payment "processing" and dispatches ProcessMeSombChargeJob.
 *      The user immediately sees "Check your phone and confirm the prompt".
 *
 *   2. ProcessMeSombChargeJob (background queue worker) calls MeSomb
 *      makeCollect() in ASYNCHRONOUS mode — this is what pushes the prompt
 *      to the user's phone. It returns in a second or two with status
 *      PENDING; the slow part (waiting for the user to confirm) is absorbed
 *      by MeSomb, not by our worker.
 *
 *   3. MeSomb fires a webhook (payment.transaction.succeeded / ...failed)
 *      when the user confirms or cancels. The callback endpoint verifies the
 *      X-MeSomb-Webhook-Signature HMAC and dispatches
 *      ProcessMeSombWebhookJob, which applies the final status to the DB
 *      (Payment's booted() hook credits the organizer wallet on 'paid').
 *
 * Every step is retried and idempotent:
 *   - the charge job skips payments that were already charged or finalized;
 *   - the webhook job deduplicates by MeSomb event id and by terminal state;
 *   - applyProviderStatus() only flips paid_at on the first transition and
 *     the Payment model's wasChanged('status') guard blocks re-credits.
 */
class MobileMoneyPaymentService
{
    // -------------------------------------------------------------------
    // PUBLIC API (called from the controller + jobs)
    // -------------------------------------------------------------------

    /**
     * Step 1: kick off the payment and return quickly.
     * For MeSomb: mark processing + queue the background charge. For mock:
     * do everything synchronously.
     */
    public function initiate(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $provider = $this->provider();

        if ($provider === 'mesomb') {
            if (! $this->mesombCredentialsConfigured()) {
                return $this->failPayment(
                    $payment,
                    'Payment provider is not configured. Please contact support.',
                    new RuntimeException('MESOMB_APPLICATION_KEY / MESOMB_ACCESS_KEY / MESOMB_SECRET_KEY are not set')
                );
            }

            return $this->initializeOnMeSomb($payment, $operator, $phoneNumber);
        }

        return $this->initiateMock($payment, $operator, $phoneNumber);
    }

    /**
     * Step 2: perform the actual mobile-money charge. Called from
     * ProcessMeSombChargeJob in the background. NEVER call this
     * synchronously from a web request.
     *
     * Idempotent: if the payment was already charged (charge_completed_at)
     * or reached a terminal state, this is a no-op — a retried job can never
     * push a second prompt to the user's phone.
     */
    public function chargeMeSomb(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $metadata = $payment->metadata ?? [];

        if (! empty($metadata['charge_completed_at'])
            || in_array($payment->status, ['paid', 'failed', 'refunded', 'cancelled'], true)) {
            Log::info('MeSomb charge skipped (already charged or final).', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ]);

            return $payment->fresh();
        }

        try {
            $response = $this->mesombClient()->makeCollect([
                'amount' => (int) round((float) $payment->amount),
                'service' => $this->mesombService($operator),
                'payer' => $this->mesombPayer($phoneNumber),
                'country' => 'CM',
                'currency' => $payment->currency ?: 'XAF',
                'fees' => true,
                'conversion' => false,
                // Asynchronous: MeSomb accepts the transaction, pushes the
                // prompt to the phone and returns immediately (PENDING).
                'mode' => 'asynchronous',
                // Reconciliation IDs — both tag the transaction with our
                // payment reference so the webhook can be matched back.
                'trxID' => $payment->reference,
                'customer' => $this->mesombCustomer($payment),
                'extra' => ['reference' => $payment->reference],
            ]);

            $transaction = (array) ($response['transaction'] ?? []);
            $pk = (string) ($transaction['pk'] ?? '');

            $payment->update([
                'external_reference' => $pk ?: $payment->external_reference,
                'provider_reference' => $pk ?: $payment->provider_reference,
                'callback_payload' => $response,
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'charge_completed_at' => now()->toISOString(),
                    'mesomb_reference' => $transaction['reference'] ?? null,
                    'mesomb_fin_trx_id' => $transaction['fin_trx_id'] ?? null,
                ],
            ]);

            Log::info('MeSomb collect call completed.', [
                'payment_id' => $payment->id,
                'pk' => $pk,
                'provider_status' => $transaction['status'] ?? ($response['status'] ?? null),
            ]);

            // If the async response already reports a final state (rare but
            // possible), apply it now — otherwise the webhook will do it.
            return $this->applyProviderStatus($payment, $response, 'charge');
        } catch (ConnectionException $e) {
            Log::warning('MeSomb collect: connection failed, will retry.', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        } catch (\Throwable $e) {
            Log::error('MeSomb collect: unexpected failure, will retry.', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Called from the user's "Confirm" button or from /payments/{id}/status
     * to ask MeSomb for the latest status (in case the webhook is delayed).
     */
    public function refreshStatus(Payment $payment): Payment
    {
        if ($payment->provider !== 'mesomb') {
            return $payment->fresh();
        }

        return $this->refreshMeSombStatus($payment);
    }

    /**
     * Apply a MeSomb status to our local DB. Used by the webhook job, the
     * background charge and the refresh-status path. Idempotent.
     *
     * Accepts any of the payload shapes MeSomb produces:
     *   - webhook:      { type, data: { object: { status, pk, message } } }
     *   - collect:      { success, status, transaction: { status, pk } }
     *   - transactions: [ { status, pk, message } ] (single element)
     */
    public function applyProviderStatus(Payment $payment, array $payload, string $source = 'callback'): Payment
    {
        $transaction = $payload['data']['object'] ?? $payload['transaction'] ?? $payload;
        if (! is_array($transaction)) {
            $transaction = [];
        }

        $statusValue = $transaction['status'] ?? $payload['status'] ?? $payload['payment_status'] ?? null;

        if ($statusValue === null) {
            // Fall back to the webhook event name.
            $eventType = strtolower((string) ($payload['type'] ?? $payload['event_type'] ?? ''));
            $statusValue = match (true) {
                str_contains($eventType, 'fail'),
                str_contains($eventType, 'cancel'),
                str_contains($eventType, 'expire') => 'FAILED',
                str_contains($eventType, 'success'),
                str_contains($eventType, 'complete'),
                str_contains($eventType, 'paid') => 'SUCCESS',
                default => null,
            };
        }

        $mappedStatus = $this->mapMeSombStatus($statusValue);

        if ($mappedStatus === null) {
            // Unparseable status — record it and leave the payment untouched.
            $payment->update([
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'last_provider_status' => $statusValue,
                    'last_status_source' => $source,
                    'last_status_checked_at' => now()->toISOString(),
                ],
            ]);

            return $payment->fresh();
        }

        // Never downgrade or resurrect a finalized payment.
        if (in_array($payment->status, ['paid', 'refunded', 'cancelled'], true)) {
            return $payment->fresh();
        }
        if ($payment->status === 'failed' && $mappedStatus === 'processing') {
            return $payment->fresh();
        }

        $failureReason = $mappedStatus === 'failed'
            ? Str::limit((string) ($transaction['message'] ?? $payload['message'] ?? 'Payment failed.'), 500, '')
            : null;

        $updates = [
            'status' => $mappedStatus,
            'failure_reason' => $failureReason,
            'callback_payload' => $payload,
            'metadata' => [
                ...($payment->metadata ?? []),
                'last_provider_status' => $statusValue,
                'last_status_source' => $source,
                'last_status_checked_at' => now()->toISOString(),
                'mesomb_fin_trx_id' => $transaction['fin_trx_id'] ?? ($payment->metadata['mesomb_fin_trx_id'] ?? null),
            ],
        ];

        $pk = (string) ($transaction['pk'] ?? '');
        if ($pk !== '') {
            $updates['provider_reference'] = $pk;
            if (! $payment->external_reference) {
                $updates['external_reference'] = $pk;
            }
        }

        // Only flip paid_at on the actual transition into paid.
        // (Duplicate webhooks would otherwise overwrite the real time.)
        if ($mappedStatus === 'paid' && ! $payment->paid_at) {
            $updates['paid_at'] = now();
        }

        $payment->update($updates);

        $registrationIds = $payment->metadata['registration_ids'] ?? [$payment->registration_id];

        if ($mappedStatus === 'paid') {
            Registration::whereIn('id', array_filter($registrationIds))
                ->update(['status' => 'confirmed']);
        }

        if ($mappedStatus === 'failed') {
            Registration::whereIn('id', array_filter($registrationIds))
                ->where('status', 'pending_payment')
                ->update(['status' => 'payment_failed']);
        }

        AuditLog::record(null, 'payment.status.updated', $payment, 'Payment status updated by provider.', [
            'status' => $mappedStatus,
            'source' => $source,
            'provider' => $payment->provider,
            'raw_status' => $statusValue,
        ]);

        return $payment->fresh();
    }

    // -------------------------------------------------------------------
    // PROVIDER-SPECIFIC INITIALIZERS
    // -------------------------------------------------------------------

    private function initiateMock(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $payment->update([
            'provider' => 'mock',
            'operator' => $operator,
            'phone_number' => $phoneNumber,
            'external_reference' => 'MOCK-'.Str::upper(Str::random(12)),
            'provider_reference' => 'MOCK-'.Str::upper(Str::random(12)),
            'status' => 'processing',
            'initiated_at' => now(),
            'metadata' => [
                ...($payment->metadata ?? []),
                'provider_mode' => 'development',
            ],
        ]);

        AuditLog::record($payment->user, 'payment.initiated', $payment, 'Payment initiated.', [
            'provider' => 'mock',
            'operator' => $operator,
        ]);

        return $payment->fresh();
    }

    /**
     * Fast part of the MeSomb flow: mark the payment "processing" and
     * dispatch the background charge job. No external HTTP call happens in
     * the web request, so the "Pay" button answers in well under a second.
     */
    private function initializeOnMeSomb(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $payment->update([
            'provider' => 'mesomb',
            'operator' => $operator,
            'phone_number' => $this->normalizeCameroonPhone($phoneNumber),
            'status' => 'processing',
            'initiated_at' => now(),
            'metadata' => [
                ...($payment->metadata ?? []),
                'operator' => $operator,
                'provider_environment' => config('payments.mesomb.env', 'PROD'),
            ],
        ]);

        AuditLog::record($payment->user, 'payment.initiated', $payment, 'Payment initiated.', [
            'provider' => 'mesomb',
            'operator' => $operator,
        ]);

        // Queue the charge. This is the call that pushes the prompt to the
        // user's phone; it runs in the worker so the HTTP response stays
        // instant ("Check your phone and confirm the prompt").
        ProcessMeSombChargeJob::dispatch($payment->id);

        return $payment->fresh();
    }

    private function refreshMeSombStatus(Payment $payment): Payment
    {
        $reference = $payment->provider_reference ?: $payment->external_reference;

        if (! $reference) {
            // The background charge hasn't run yet — nothing to check.
            return $payment->fresh();
        }

        try {
            $transactions = $this->mesombClient()->getTransactions([$reference]);
        } catch (\Throwable $e) {
            Log::warning('MeSomb status check failed.', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            $payment->update([
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'last_status_error' => $e->getMessage(),
                    'last_status_checked_at' => now()->toISOString(),
                ],
            ]);

            return $payment->fresh();
        }

        if (empty($transactions)) {
            Log::info('MeSomb status check: no transactions returned.', [
                'payment_id' => $payment->id,
                'reference' => $reference,
            ]);

            return $payment->fresh();
        }

        return $this->applyProviderStatus($payment, $transactions[0], 'status_check');
    }

    private function failPayment(Payment $payment, string $message, \Throwable $exception): Payment
    {
        $payment->update([
            'provider' => $this->provider(),
            'status' => 'failed',
            'failure_reason' => $message,
            'metadata' => [
                ...($payment->metadata ?? []),
                'error' => $exception->getMessage(),
            ],
        ]);

        $registrationIds = $payment->metadata['registration_ids'] ?? [$payment->registration_id];
        Registration::whereIn('id', array_filter($registrationIds))
            ->where('status', 'pending_payment')
            ->update(['status' => 'payment_failed']);

        AuditLog::record($payment->user, 'payment.failed', $payment, 'Payment initiation failed.', [
            'provider' => $payment->provider,
            'error' => $exception->getMessage(),
        ]);

        return $payment->fresh();
    }

    // -------------------------------------------------------------------
    // PROVIDER-SPECIFIC HELPERS
    // -------------------------------------------------------------------

    private function provider(): string
    {
        return strtolower((string) config('payments.provider', 'mock'));
    }

    private function mesombCredentialsConfigured(): bool
    {
        $settings = config('payments.mesomb', []);

        return ! empty($settings['application_key'])
            && ! empty($settings['access_key'])
            && ! empty($settings['secret_key']);
    }

    private function mesombClient(): MeSombClient
    {
        $settings = config('payments.mesomb', []);
        $applicationKey = (string) ($settings['application_key'] ?? '');
        $accessKey = (string) ($settings['access_key'] ?? '');
        $secretKey = (string) ($settings['secret_key'] ?? '');

        if ($applicationKey === '' || $accessKey === '' || $secretKey === '') {
            throw new RuntimeException('MeSomb credentials are missing. Set MESOMB_APPLICATION_KEY, MESOMB_ACCESS_KEY and MESOMB_SECRET_KEY.');
        }

        return new MeSombClient(
            $applicationKey,
            $accessKey,
            $secretKey,
            (string) ($settings['base_url'] ?? 'https://mesomb.hachther.com'),
            (int) ($settings['timeout'] ?? 60),
        );
    }

    /**
     * Map our internal operator code to a MeSomb service.
     */
    private function mesombService(string $operator): string
    {
        return match (strtolower($operator)) {
            'orange' => 'ORANGE',
            'mtn' => 'MTN',
            default => 'MTN',
        };
    }

    /**
     * MeSomb wants the payer number in local format (9 digits, no country
     * code): e.g. 677123456.
     */
    private function mesombPayer(string $phoneNumber): string
    {
        $digits = preg_replace('/\D+/', '', $phoneNumber) ?? '';

        if (str_starts_with($digits, '237')) {
            $digits = substr($digits, 3);
        }

        return $digits;
    }

    /**
     * Store phone numbers in +237XXXXXXXXX format.
     */
    private function normalizeCameroonPhone(string $phoneNumber): string
    {
        $digits = preg_replace('/\D+/', '', $phoneNumber) ?? '';

        if (! str_starts_with($digits, '237')) {
            $digits = '237'.$digits;
        }

        return '+'.$digits;
    }

    /**
     * Customer info sent to MeSomb for analytics (all optional).
     *
     * @return array<string, string>
     */
    private function mesombCustomer(Payment $payment): array
    {
        $profile = $payment->user?->profile;

        return array_filter([
            'phone' => $payment->phone_number ?: null,
            'email' => $payment->user?->email,
            'first_name' => $payment->user?->name,
            'town' => $profile?->city,
            'region' => $profile?->region,
            'country' => 'CM',
        ], fn ($value) => $value !== null && $value !== '');
    }

    /**
     * Map a MeSomb transaction status to our internal status.
     *
     * Returns null for unknown values so callers can leave the payment
     * untouched instead of guessing.
     */
    private function mapMeSombStatus(mixed $status): ?string
    {
        if ($status === null) {
            return null;
        }

        $value = strtolower((string) $status);

        return match (true) {
            in_array($value, ['success', 'succeeded', 'successful', 'complete', 'completed', 'paid'], true) => 'paid',
            in_array($value, ['failed', 'failure', 'cancelled', 'canceled', 'expired', 'rejected'], true) => 'failed',
            in_array($value, ['pending', 'processing', 'in_progress', 'initiated', 'created'], true) => 'processing',
            default => null,
        };
    }
}
