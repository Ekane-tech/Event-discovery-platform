<?php

namespace App\Services\Payments;

use App\Jobs\ProcessNotchPayChargeJob;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Registration;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Payment service for Mboa Events 237.
 *
 * Supports two providers:
 *   - "mock"    : local development, no external calls
 *   - "notchpay" : Cameroon mobile money (MTN / Orange) via NotchPay
 *
 * The NotchPay flow is split into two phases so the user-facing
 * "Pay" button feels instant:
 *
 *   1. initiate()  → initializeOnNotchPay()  (fast, < 2s)
 *      Creates the payment on NotchPay and returns 202 immediately.
 *      The user sees "Check your phone and confirm the prompt".
 *
 *   2. chargeNotchPay() runs in the background via
 *      ProcessNotchPayChargeJob. It calls the slow endpoint
 *      (5-30s, blocks on the user's phone confirmation).
 *
 *   3. NotchPay fires a webhook when the user confirms. We
 *      verify the signature and dispatch ProcessNotchPayWebhookJob
 *      which updates the DB and sends the email.
 *
 * All three steps are independently retried and idempotent.
 */
class MobileMoneyPaymentService
{
    // -------------------------------------------------------------------
    // PUBLIC API (called from the controller)
    // -------------------------------------------------------------------

    /**
     * Step 1: initialize the payment and return quickly.
     * For NotchPay: just create the payment object, then queue the
     * slow charge. For mock: do everything synchronously.
     */
    public function initiate(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $provider = strtolower((string) config('payments.provider', env('PAYMENT_PROVIDER', 'mock')));

        if ($provider === 'notchpay' && empty(env('NOTCHPAY_PUBLIC_KEY'))) {
            return $this->failPayment(
                $payment,
                'Payment provider is not configured. Please contact support.',
                new \RuntimeException('NOTCHPAY_PUBLIC_KEY is not set')
            );
        }

        return match ($provider) {
            'notchpay' => $this->initializeOnNotchPay($payment, $operator, $phoneNumber),
            default => $this->initiateMock($payment, $operator, $phoneNumber),
        };
    }

    /**
     * Step 2: do the actual mobile-money charge. Called from
     * ProcessNotchPayChargeJob in the background. NEVER call this
     * synchronously from a web request.
     */
    public function chargeNotchPay(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        try {
            $reference = (string) ($payment->external_reference ?: $payment->reference);
            $channel = $this->notchpayChannel($operator);
            $phone = $this->notchpayPhone($phoneNumber);
            $key = $this->notchpayKey();
            $baseUrl = $this->notchpayBaseUrl();
            $chargeTimeout = (int) env('NOTCHPAY_CHARGE_TIMEOUT', 90);

            $chargeResponse = Http::withHeaders([
                    'Authorization' => $key,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->timeout($chargeTimeout)
                ->connectTimeout(10)
                ->post($baseUrl.'/payments/'.$reference, [
                    'channel' => $channel,
                    'data' => [
                        'phone' => $phone,
                    ],
                ]);

            $payload = $chargeResponse->json() ?? [];
            $data = (array) ($payload['data'] ?? []);
            $transaction = (array) ($data['transaction'] ?? $payload['transaction'] ?? []);

            $providerReference = (string) (
                $transaction['id'] ?? $data['id'] ?? $payload['id'] ?? $reference
            );

            $payment->update([
                'provider_reference' => $providerReference,
                'callback_payload' => $payload,
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'channel' => $channel,
                    'notchpay_reference' => $reference,
                    'charge_completed_at' => now()->toISOString(),
                ],
            ]);

            Log::info('NotchPay charge call completed.', [
                'payment_id' => $payment->id,
                'provider_reference' => $providerReference,
                'http_status' => $chargeResponse->status(),
            ]);

            return $payment->fresh();
        } catch (ConnectionException $e) {
            Log::warning('NotchPay charge: connection failed, will retry.', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        } catch (\Throwable $e) {
            Log::error('NotchPay charge: unexpected failure, will retry.', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Called from the user's "Confirm" button or from /payments/{id}/status
     * to ask NotchPay for the latest status (in case the webhook is delayed).
     */
    public function refreshStatus(Payment $payment): Payment
    {
        if ($payment->provider !== 'notchpay') {
            return $payment->fresh();
        }

        return $this->refreshNotchPayStatus($payment);
    }

    /**
     * Apply a NotchPay status to our local DB. Used by both the
     * webhook job and the refresh-status path.
     */
    public function applyProviderStatus(Payment $payment, array $payload, string $source = 'callback'): Payment
    {
        $data = (array) ($payload['data'] ?? []);
        $transaction = (array) ($data['transaction'] ?? $payload['transaction'] ?? []);

        // Status can be in any of these places depending on payload shape.
        $statusValue = $payload['status']
            ?? $payload['payment_status']
            ?? $transaction['status']
            ?? $data['status']
            ?? null;

        $mappedStatus = $this->mapNotchPayStatus($statusValue);

        $failureReason = $mappedStatus === 'failed'
            ? Str::limit((string) (
                $payload['message']
                ?? $transaction['message']
                ?? 'Payment failed.'
            ), 500, '')
            : null;

        $metadata = [
            ...($payment->metadata ?? []),
            'last_provider_status' => $statusValue,
            'last_status_source' => $source,
            'last_status_checked_at' => now()->toISOString(),
        ];

        $updates = [
            'status' => $mappedStatus,
            'failure_reason' => $failureReason,
            'callback_payload' => $payload,
            'metadata' => $metadata,
        ];

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
     * Fast part of the NotchPay flow: just create the payment object
     * on NotchPay. Returns within 1-2 seconds. The user already
     * sees "processing" by the time this returns; the slow charge
     * call runs in the background via ProcessNotchPayChargeJob.
     */
    private function initializeOnNotchPay(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        try {
            $baseUrl = $this->notchpayBaseUrl();
            $key = $this->notchpayKey();
            $phone = $this->notchpayPhone($phoneNumber);
            $initTimeout = (int) env('NOTCHPAY_INIT_TIMEOUT', 30);

            $customerEmail = $payment->user?->email;
            if (! $customerEmail || ! filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
                return $this->failPayment(
                    $payment,
                    'A valid customer email is required to initiate a payment.',
                    new \RuntimeException('Missing customer email')
                );
            }

            $idempotencyKey = $payment->reference;

            $initResponse = Http::withHeaders([
                    'Authorization' => $key,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'Idempotency-Key' => $idempotencyKey,
                ])
                ->timeout($initTimeout)
                ->connectTimeout(10)
                ->post($baseUrl.'/payments', [
                    'amount' => (int) round((float) $payment->amount),
                    'currency' => $payment->currency ?: 'XAF',
                    'customer' => [
                        'name' => $payment->user?->name ?? 'Customer',
                        'email' => $customerEmail,
                        'phone' => $phone,
                    ],
                    'description' => Str::limit('Payment for '.($payment->event?->title ?? 'event'), 120, ''),
                    'reference' => $payment->reference,
                    'metadata' => [
                        'operator' => $operator,
                        'event_id' => $payment->event_id,
                        'registration_ids' => $payment->metadata['registration_ids'] ?? [$payment->registration_id],
                    ],
                ]);

            $initPayload = $initResponse->json() ?? [];

            $reference = $initPayload['transaction']['reference']
                ?? $initPayload['transaction']['id']
                ?? $initPayload['payment']['reference']
                ?? null;

            if (! $initResponse->successful() || ! $reference) {
                return $this->failPayment(
                    $payment,
                    'NotchPay initialization failed: '.Str::limit((string) ($initPayload['message'] ?? 'Unknown error'), 200, ''),
                    new \RuntimeException((string) ($initPayload['message'] ?? 'NotchPay initialization error'))
                );
            }

            // Mark the payment as "processing" and persist the operator / phone
            // so the background job knows what to charge. external_reference is
            // the NotchPay reference we'll POST against in the charge step.
            $payment->update([
                'provider' => 'notchpay',
                'operator' => $operator,
                'phone_number' => $phone,
                'external_reference' => (string) $reference,
                'status' => 'processing',
                'initiated_at' => now(),
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'operator' => $operator,
                    'provider_environment' => env('NOTCHPAY_ENV', 'DEV'),
                    'notchpay_reference' => (string) $reference,
                    'idempotency_key' => $idempotencyKey,
                ],
            ]);

            AuditLog::record($payment->user, 'payment.initiated', $payment, 'Payment initiated.', [
                'provider' => 'notchpay',
                'operator' => $operator,
                'notchpay_reference' => (string) $reference,
            ]);

            // Queue the SLOW charge call. This is the bit that waits for the
            // user to approve the prompt on their phone. We do NOT block on it.
            ProcessNotchPayChargeJob::dispatch($payment->id);

            return $payment->fresh();
        } catch (ConnectionException $e) {
            return $this->failPayment(
                $payment,
                'Could not reach the payment provider. Please check your internet and try again.',
                $e
            );
        } catch (\Throwable $e) {
            return $this->failPayment(
                $payment,
                'Payment initialization failed. Please try again.',
                $e
            );
        }
    }

    // -------------------------------------------------------------------
    // PROVIDER-SPECIFIC HELPERS
    // -------------------------------------------------------------------

    private function refreshNotchPayStatus(Payment $payment): Payment
    {
        $reference = $payment->provider_reference ?: $payment->external_reference ?: $payment->reference;

        if (! $reference) {
            $payment->update(['failure_reason' => 'Missing payment provider reference.']);
            return $payment->fresh();
        }

        try {
            $baseUrl = $this->notchpayBaseUrl();
            $key = $this->notchpayKey();

            $response = Http::withHeaders([
                    'Authorization' => $key,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->timeout((int) env('NOTCHPAY_STATUS_TIMEOUT', 30))
                ->connectTimeout(10)
                ->get($baseUrl.'/payments/'.$reference);

            $payload = $response->json() ?? [];

            if (! $response->successful()) {
                $payment->update([
                    'metadata' => [
                        ...($payment->metadata ?? []),
                        'last_status_error' => $payload['message'] ?? 'Unable to fetch provider status.',
                        'last_status_checked_at' => now()->toISOString(),
                    ],
                ]);
                return $payment->fresh();
            }

            return $this->applyProviderStatus($payment, $payload, 'status_check');
        } catch (\Throwable $exception) {
            Log::warning('NotchPay status check failed.', [
                'payment_id' => $payment->id,
                'error' => $exception->getMessage(),
            ]);

            $payment->update([
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'last_status_error' => $exception->getMessage(),
                    'last_status_checked_at' => now()->toISOString(),
                ],
            ]);

            return $payment->fresh();
        }
    }

    private function failPayment(Payment $payment, string $message, \Throwable $exception): Payment
    {
        $payment->update([
            'provider' => strtolower((string) config('payments.provider', env('PAYMENT_PROVIDER', 'notchpay'))),
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

    private function notchpayKey(): string
    {
        $key = env('NOTCHPAY_PUBLIC_KEY');
        if (! $key) {
            throw new \RuntimeException('NotchPay credentials are missing. Set NOTCHPAY_PUBLIC_KEY.');
        }
        return (string) $key;
    }

    private function notchpayBaseUrl(): string
    {
        $base = env('NOTCHPAY_BASE_URL');
        return $base ? rtrim((string) $base, '/') : 'https://api.notchpay.co';
    }

    /**
     * Map our internal operator code to a NotchPay channel.
     * See https://developer.notchpay.co/accept-payments/mobile-money
     */
    private function notchpayChannel(string $operator): string
    {
        return match (strtolower($operator)) {
            'mtn' => 'cm.mtn',
            'orange' => 'cm.orange',
            default => 'cm.mobile',
        };
    }

    private function notchpayPhone(string $phoneNumber): string
    {
        $digits = preg_replace('/\D+/', '', $phoneNumber);
        if (! str_starts_with($digits, '237')) {
            $digits = '237'.$digits;
        }
        return '+'.$digits;
    }

    private function mapNotchPayStatus(mixed $status, bool $requestAccepted = false): string
    {
        $value = strtolower((string) $status);

        if (in_array($value, ['complete', 'paid', 'successful', 'success', 'completed'], true)) {
            return 'paid';
        }

        if (in_array($value, ['failed', 'failure', 'cancelled', 'canceled', 'expired', 'rejected'], true)) {
            return 'failed';
        }

        if ($value === 'pending' || $value === 'processing') {
            return 'processing';
        }

        return $requestAccepted ? 'processing' : 'failed';
    }
}
