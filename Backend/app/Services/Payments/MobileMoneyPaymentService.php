<?php

namespace App\Services\Payments;

use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Registration;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MobileMoneyPaymentService
{
    public function initiate(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $provider = strtolower((string) env('PAYMENT_PROVIDER', 'mock'));

        return match ($provider) {
            'campay' => $this->initiateCampay($payment, $operator, $phoneNumber),
            default => $this->initiateMock($payment, $operator, $phoneNumber),
        };
    }

    public function refreshStatus(Payment $payment): Payment
    {
        if ($payment->provider !== 'campay') {
            return $payment->fresh();
        }

        return $this->refreshCampayStatus($payment);
    }

    public function applyProviderStatus(Payment $payment, array $payload, string $source = 'callback'): Payment
    {
        $mappedStatus = $this->mapCampayStatus($payload['status'] ?? $payload['payment_status'] ?? null);
        $metadata = [
            ...($payment->metadata ?? []),
            'last_provider_status' => $payload['status'] ?? $payload['payment_status'] ?? null,
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

    private function initiateCampay(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        try {
            $token = $this->campayToken();
            $baseUrl = $this->campayBaseUrl();

            $response = Http::withToken($token, 'Token')
                ->acceptJson()
                ->asJson()
                ->timeout((int) env('CAMPAY_TIMEOUT', 30))
                ->post($baseUrl.'/api/collect/', [
                    'amount' => (string) (int) round((float) $payment->amount),
                    'currency' => $payment->currency ?: 'XAF',
                    'from' => $this->campayPhone($phoneNumber),
                    'description' => Str::limit('Payment for '.$payment->event?->title, 120, ''),
                    'external_reference' => $payment->reference,
                ]);

            $payload = $response->json() ?? [];
            $providerReference = $payload['reference'] ?? $payload['transaction_id'] ?? null;
            $mappedStatus = $this->mapCampayStatus($payload['status'] ?? null, $response->successful());

            $payment->update([
                'provider' => 'campay',
                'operator' => $operator,
                'phone_number' => $this->campayPhone($phoneNumber),
                'external_reference' => $payment->reference,
                'provider_reference' => $providerReference,
                'status' => $mappedStatus,
                'failure_reason' => $mappedStatus === 'failed' ? ($payload['message'] ?? 'Payment provider request failed.') : null,
                'callback_payload' => $payload,
                'initiated_at' => now(),
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'ussd_code' => $payload['ussd_code'] ?? null,
                    'operator' => $payload['operator'] ?? $operator,
                    'provider_environment' => env('CAMPAY_ENV', 'DEV'),
                ],
            ]);

            AuditLog::record($payment->user, 'payment.initiated', $payment, 'Payment initiated.', [
                'provider' => 'campay',
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

    private function refreshCampayStatus(Payment $payment): Payment
    {
        $reference = $payment->provider_reference ?: $payment->external_reference ?: $payment->reference;

        if (! $reference) {
            $payment->update(['failure_reason' => 'Missing payment provider reference.']);
            return $payment->fresh();
        }

        try {
            $response = Http::withToken($this->campayToken(), 'Token')
                ->acceptJson()
                ->timeout((int) env('CAMPAY_TIMEOUT', 30))
                ->get($this->campayBaseUrl().'/api/transaction/'.$reference.'/');

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
            'provider' => strtolower((string) env('PAYMENT_PROVIDER', 'campay')),
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

    private function campayToken(): string
    {
        if (env('CAMPAY_TOKEN')) {
            return (string) env('CAMPAY_TOKEN');
        }

        $username = env('CAMPAY_APP_USERNAME');
        $password = env('CAMPAY_APP_PASSWORD');

        if (! $username || ! $password) {
            throw new \RuntimeException('Campay credentials are missing. Set CAMPAY_APP_USERNAME and CAMPAY_APP_PASSWORD.');
        }

        return Cache::remember('campay_api_token_'.md5($username.'|'.env('CAMPAY_ENV', 'DEV')), now()->addMinutes(45), function () use ($username, $password) {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout((int) env('CAMPAY_TIMEOUT', 30))
                ->post($this->campayBaseUrl().'/api/token/', [
                    'username' => $username,
                    'password' => $password,
                ]);

            $payload = $response->json() ?? [];

            if (! $response->successful() || empty($payload['token'])) {
                throw new \RuntimeException($payload['message'] ?? 'Unable to authenticate with Campay.');
            }

            return $payload['token'];
        });
    }

    private function campayBaseUrl(): string
    {
        if (env('CAMPAY_BASE_URL')) {
            return rtrim((string) env('CAMPAY_BASE_URL'), '/');
        }

        return strtoupper((string) env('CAMPAY_ENV', 'DEV')) === 'PROD'
            ? 'https://www.campay.net'
            : 'https://demo.campay.net';
    }

    private function campayPhone(string $phoneNumber): string
    {
        return ltrim(preg_replace('/\D+/', '', $phoneNumber), '+');
    }

    private function mapCampayStatus(mixed $status, bool $requestAccepted = false): string
    {
        $value = strtoupper((string) $status);

        if (in_array($value, ['SUCCESSFUL', 'SUCCESS', 'COMPLETED', 'PAID'], true)) {
            return 'paid';
        }

        if (in_array($value, ['FAILED', 'FAILURE', 'CANCELLED', 'CANCELED', 'EXPIRED'], true)) {
            return 'failed';
        }

        return $requestAccepted ? 'processing' : 'failed';
    }
}
