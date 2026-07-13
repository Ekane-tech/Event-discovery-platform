<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MobileMoneyPaymentService
{
    public function initiate(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $provider = config('services.payment.provider', env('PAYMENT_PROVIDER', 'mock'));

        return match ($provider) {
            'campay' => $this->initiateCampay($payment, $operator, $phoneNumber),
            default => $this->initiateMock($payment, $operator, $phoneNumber),
        };
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
                'message' => 'Mock mobile money request initiated. Confirm from the local payment screen.',
            ],
        ]);

        return $payment->fresh();
    }

    private function initiateCampay(Payment $payment, string $operator, string $phoneNumber): Payment
    {
        $baseUrl = rtrim((string) env('CAMPAY_BASE_URL'), '/');
        $token = env('CAMPAY_TOKEN');

        if (! $baseUrl || ! $token) {
            $payment->update([
                'status' => 'failed',
                'failure_reason' => 'Campay is not configured. Set CAMPAY_BASE_URL and CAMPAY_TOKEN.',
            ]);

            return $payment->fresh();
        }

        $response = Http::withToken($token)->post($baseUrl.'/collect/', [
            'amount' => (int) $payment->amount,
            'currency' => $payment->currency,
            'from' => $phoneNumber,
            'description' => 'Payment for event '.$payment->event?->title,
            'external_reference' => $payment->reference,
        ]);

        $payload = $response->json() ?? [];

        $payment->update([
            'provider' => 'campay',
            'operator' => $operator,
            'phone_number' => $phoneNumber,
            'external_reference' => $payment->reference,
            'provider_reference' => $payload['reference'] ?? $payload['transaction_id'] ?? null,
            'status' => $response->successful() ? 'processing' : 'failed',
            'failure_reason' => $response->successful() ? null : ($payload['message'] ?? 'Payment provider request failed.'),
            'callback_payload' => $payload,
            'initiated_at' => now(),
        ]);

        return $payment->fresh();
    }
}
