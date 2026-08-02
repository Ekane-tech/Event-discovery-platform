<?php

namespace App\Services\Payments;

use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Registration;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MobileMoneyPaymentService
{
    public function initiate(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $provider = strtolower((string) env('PAYMENT_PROVIDER', 'mock'));

        return match ($provider) {
            'notchpay' => $this->initiateNotchPay($payment, $operator, $phoneNumber),
            default => $this->initiateMock($payment, $operator, $phoneNumber),
        };
    }

    public function refreshStatus(Payment $payment): Payment
    {
        if ($payment->provider !== 'notchpay') {
            return $payment->fresh();
        }

        return $this->refreshNotchPayStatus($payment);
    }

    public function applyProviderStatus(Payment $payment, array $payload, string $source = 'callback'): Payment
    {
        $statusValue = $payload['status'] ?? $payload['payment_status'] ?? $payload['transaction']['status'] ?? null;
        $mappedStatus = $this->mapNotchPayStatus($statusValue);
        $metadata = [
            ...($payment->metadata ?? []),
            'last_provider_status' => $payload['status'] ?? $payload['payment_status'] ?? $payload['transaction']['status'] ?? null,
            'last_status_source' => $source,
            'last_status_checked_at' => now()->toISOString(),
        ];

        $payment->update([
            'status' => $mappedStatus,
            'paid_at' => $mappedStatus === 'paid' ? ($payment->paid_at ?: now()) : null,
            'failure_reason' => $mappedStatus === 'failed' ? ($payload['message'] ?? 'Payment failed.') : null,
            'callback_payload' => $payload,
            'metadata' => $metadata,
        ]);

        $registrationIds = $payment->metadata['registration_ids'] ?? [$payment->registration_id];

        if ($mappedStatus === 'paid') {
            Registration::whereIn('id', array_filter($registrationIds))->update(['status' => 'confirmed']);
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
        ]);

        return $payment->fresh();
    }

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

    private function initiateNotchPay(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        try {
            $baseUrl = $this->notchpayBaseUrl();
            $key = $this->notchpayKey();
            $channel = $operator === 'mtn' ? 'cm.mtn' : 'cm.orange';
            $normalizedPhone = $this->notchpayPhone($phoneNumber);

            // Step 1: Initialize payment
            $initResponse = Http::withHeaders([
                    'Authorization' => $key,
                    'Content-Type' => 'application/json',
                ])
                ->timeout((int) env('NOTCHPAY_TIMEOUT', 30))
                ->post($baseUrl.'/payments', [
                    'amount' => (int) round((float) $payment->amount),
                    'currency' => $payment->currency ?: 'XAF',
                    'customer' => [
                        'name' => $payment->user?->name ?? 'Customer',
                        'email' => $payment->user?->email ?? 'customer@example.com',
                        'phone' => $normalizedPhone,
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

            if (! $initResponse->successful() || (empty($initPayload['transaction']['reference']) && empty($initPayload['transaction']['id']))) {
                return $this->failPayment($payment, 'NotchPay initialization failed: '.($initPayload['message'] ?? 'Unknown error'), new \RuntimeException($initPayload['message'] ?? 'NotchPay initialization error'));
            }

            $reference = $initPayload['transaction']['reference'] ?? $initPayload['transaction']['id'] ?? $payment->reference;

            // Step 2: Process mobile money
            $chargeResponse = Http::withHeaders([
                    'Authorization' => $key,
                    'Content-Type' => 'application/json',
                ])
                ->timeout((int) env('NOTCHPAY_TIMEOUT', 60))
                ->post($baseUrl.'/payments/'.$reference, [
                    'channel' => $channel,
                    'data' => [
                        'phone' => $normalizedPhone,
                    ],
                ]);

            $chargePayload = $chargeResponse->json() ?? [];
            $providerReference = $chargePayload['transaction']['id'] ?? $chargePayload['transaction']['reference'] ?? $reference;
            $mappedStatus = $this->mapNotchPayStatus($chargePayload['transaction']['status'] ?? $chargePayload['status'] ?? null, $chargeResponse->successful());

            $payment->update([
                'provider' => 'notchpay',
                'operator' => $operator,
                'phone_number' => $normalizedPhone,
                'external_reference' => $payment->reference,
                'provider_reference' => $providerReference,
                'status' => $mappedStatus,
                'failure_reason' => $mappedStatus === 'failed' ? ($chargePayload['message'] ?? $initPayload['message'] ?? 'Payment provider request failed.') : null,
                'callback_payload' => $chargePayload,
                'initiated_at' => now(),
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'operator' => $operator,
                    'provider_environment' => env('NOTCHPAY_ENV', 'DEV'),
                    'notchpay_reference' => $reference,
                ],
            ]);

            AuditLog::record($payment->user, 'payment.initiated', $payment, 'Payment initiated.', [
                'provider' => 'notchpay',
                'operator' => $operator,
                'provider_reference' => $providerReference,
                'status' => $mappedStatus,
            ]);

            if ($mappedStatus === 'paid') {
                $registrationIds = $payment->metadata['registration_ids'] ?? [$payment->registration_id];
                Registration::whereIn('id', array_filter($registrationIds))->update(['status' => 'confirmed']);
            }

            return $payment->fresh();
        } catch (ConnectionException $exception) {
            return $this->failPayment($payment, 'Payment provider connection failed.', $exception);
        } catch (\Throwable $exception) {
            return $this->failPayment($payment, 'Payment provider request failed.', $exception);
        }
    }

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
                ])
                ->timeout((int) env('NOTCHPAY_TIMEOUT', 30))
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
            Log::warning('NotchPay payment status check failed.', [
                'payment_id' => $payment->id,
                'provider' => $payment->provider,
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
            'provider' => strtolower((string) env('PAYMENT_PROVIDER', 'notchpay')),
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
        if (env('NOTCHPAY_BASE_URL')) {
            return rtrim((string) env('NOTCHPAY_BASE_URL'), '/');
        }
        return 'https://api.notchpay.co';
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
