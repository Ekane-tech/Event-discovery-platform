<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Jobs\ProcessNotchPayWebhookJob;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Registration;
use App\Services\Payments\MobileMoneyPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::query()
            ->where('user_id', $request->user()->id)
            ->with(['event.category', 'event.region', 'event.city', 'registration'])
            ->latest()
            ->paginate(min((int) $request->input('per_page', 15), 50));

        return response()->json([
            'payments' => PaymentResource::collection($payments),
        ]);
    }

    public function show(Request $request, Payment $payment): JsonResponse
    {
        $this->authorizePaymentOwner($request, $payment);

        return response()->json([
            'payment' => new PaymentResource($payment->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ]);
    }

    /**
     * Initiate a mobile-money payment.
     *
     * For NotchPay, this is now FAST: it only calls the /payments
     * endpoint (1-2s), then queues the slow /payments/{ref} charge
     * call. The user gets the response immediately and sees
     * "Check your phone and confirm the prompt".
     *
     * The final status (paid/failed) comes from the webhook.
     */
    public function initiate(Request $request, Payment $payment, MobileMoneyPaymentService $paymentService): JsonResponse
    {
        $this->authorizePaymentOwner($request, $payment);

        if (! in_array($payment->status, ['pending', 'processing', 'failed'], true)) {
            return response()->json([
                'message' => 'This payment cannot be initiated.',
                'payment' => new PaymentResource($payment),
            ], 422);
        }

        $validated = $request->validate([
            'operator' => ['required', Rule::in(['mtn', 'orange'])],
            'phone_number' => ['required', 'string', 'regex:/^(\+?237)?6[0-9]{8}$/'],
        ]);

        if ($payment->status === 'failed') {
            $payment->update([
                'status' => 'pending',
                'reference' => $this->generatePaymentReference($payment),
                'external_reference' => null,
                'provider_reference' => null,
                'failure_reason' => null,
                'callback_payload' => null,
                'metadata' => [
                    ...($payment->metadata ?? []),
                    'retry_started_at' => now()->toISOString(),
                ],
            ]);

            $registrationIds = $payment->metadata['registration_ids'] ?? [$payment->registration_id];
            Registration::whereIn('id', array_filter($registrationIds))
                ->where('status', 'payment_failed')
                ->update(['status' => 'pending_payment']);

            $payment->refresh();
        }

        $payment = $paymentService->initiate($payment, $validated['operator'], $this->normalizePhoneNumber($validated['phone_number']));

        return response()->json([
            'message' => match ($payment->status) {
                'paid' => 'Payment completed successfully.',
                'failed' => $payment->failure_reason ?? 'Payment initiation failed.',
                default => 'Check your phone and confirm the payment prompt. We will email you when it is confirmed.',
            },
            'payment' => new PaymentResource($payment->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ], $payment->status === 'failed' ? 422 : ($payment->status === 'paid' ? 200 : 202));
    }

    /**
     * User-facing "Confirm" button. Asks NotchPay for the current
     * status. Useful when the webhook is delayed or the user wants
     * an instant check.
     */
    public function confirm(Request $request, Payment $payment, MobileMoneyPaymentService $paymentService): JsonResponse
    {
        $this->authorizePaymentOwner($request, $payment);

        if ($payment->status === 'paid') {
            return response()->json([
                'message' => 'Payment is already confirmed.',
                'payment' => new PaymentResource($payment->load(['event', 'registration'])),
            ]);
        }

        if (! in_array($payment->status, ['pending', 'processing'], true)) {
            return response()->json([
                'message' => 'This payment cannot be confirmed.',
                'payment' => new PaymentResource($payment),
            ], 422);
        }

        if ($payment->provider === 'notchpay') {
            $payment = $paymentService->refreshStatus($payment);

            return response()->json([
                'message' => match ($payment->status) {
                    'paid' => 'Payment confirmed successfully.',
                    'failed' => $payment->failure_reason ?? 'Payment failed.',
                    default => 'Still waiting for confirmation. Please approve the prompt on your phone.',
                },
                'payment' => new PaymentResource($payment->load(['event.category', 'event.region', 'event.city', 'registration'])),
            ], $payment->status === 'failed' ? 422 : 200);
        }

        // Mock provider: just flip to paid synchronously.
        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'metadata' => [
                ...($payment->metadata ?? []),
                'development_confirmed_at' => now()->toISOString(),
                'development_confirmed_ip' => $request->ip(),
            ],
        ]);

        $registrationIds = $payment->metadata['registration_ids'] ?? [$payment->registration_id];
        Registration::whereIn('id', array_filter($registrationIds))->update(['status' => 'confirmed']);

        AuditLog::record($request->user(), 'payment.confirmed', $payment, 'Payment confirmed.', [
            'provider' => $payment->provider,
        ]);

        return response()->json([
            'message' => 'Payment confirmed successfully.',
            'payment' => new PaymentResource($payment->fresh()->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ]);
    }

    public function status(Request $request, Payment $payment, MobileMoneyPaymentService $paymentService): JsonResponse
    {
        $this->authorizePaymentOwner($request, $payment);

        if ($payment->provider === 'notchpay' && in_array($payment->status, ['pending', 'processing'], true)) {
            $payment = $paymentService->refreshStatus($payment);
        }

        return response()->json([
            'payment' => new PaymentResource($payment->fresh()->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ]);
    }

    /**
     * NotchPay webhook receiver.
     *
     * Deliberately tiny so the response stays sub-100ms:
     *   1. Verify the X-Notch-Signature HMAC.
     *   2. Extract the event type + reference.
     *   3. Enqueue ProcessNotchPayWebhookJob.
     *   4. Return 200.
     *
     * All DB work and email side-effects happen in the queued job.
     */
    public function notchpayCallback(Request $request): JsonResponse
    {
        if (! $this->validNotchPayCallback($request)) {
            Log::warning('NotchPay webhook rejected: invalid signature.', [
                'ip' => $request->ip(),
                'has_header' => (bool) $request->header('X-Notch-Signature'),
                'has_body_field' => (bool) $request->input('signature'),
            ]);
            return response()->json(['message' => 'Invalid callback signature.'], 403);
        }

        $eventType = (string) ($request->input('type') ?? '');
        $data = (array) $request->input('data', []);

        $reference = $data['reference']
            ?? $data['id']
            ?? $request->input('external_reference')
            ?? $request->input('reference')
            ?? $request->input('merchant_reference');

        if (! $reference) {
            Log::warning('NotchPay webhook rejected: missing payment reference.', [
                'event' => $eventType,
                'payload_keys' => array_keys($request->all()),
            ]);
            return response()->json(['message' => 'Missing payment reference.'], 422);
        }

        if ($eventType !== '' && ! str_starts_with($eventType, 'payment.')) {
            Log::info('NotchPay webhook ignored: non-payment event.', ['event' => $eventType]);
            return response()->json(['message' => 'Event ignored.'], 200);
        }

        try {
            ProcessNotchPayWebhookJob::dispatch(
                (string) $reference,
                $request->all(),
                $eventType,
            );
        } catch (\Throwable $e) {
            // Queue is down — fail loud so NotchPay retries.
            Log::error('NotchPay webhook: failed to enqueue process job.', [
                'reference' => $reference,
                'event' => $eventType,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Queue unavailable, please retry.'], 503);
        }

        return response()->json(['message' => 'Callback queued.']);
    }

    private function authorizePaymentOwner(Request $request, Payment $payment): void
    {
        if ((int) $payment->user_id !== (int) $request->user()->id) {
            abort(403, 'You do not have permission to access this payment.');
        }
    }

    private function generatePaymentReference(Payment $payment): string
    {
        do {
            $reference = 'PAY-EVT-'.$payment->event_id.'-'.Str::upper(Str::random(10));
        } while (Payment::where('reference', $reference)->where('id', '!=', $payment->id)->exists());

        return $reference;
    }

    private function normalizePhoneNumber(string $phoneNumber): string
    {
        $digits = preg_replace('/\D+/', '', $phoneNumber);

        if (str_starts_with($digits, '237')) {
            return '+'.$digits;
        }

        return '+237'.$digits;
    }

    /**
     * Verify the NotchPay webhook signature.
     *
     * Official header: X-Notch-Signature (HMAC-SHA256 of the raw
     * request body, hex-encoded, signed with the webhook secret).
     *
     * In production the secret MUST be set or we reject the request.
     */
    private function validNotchPayCallback(Request $request): bool
    {
        $secret = env('NOTCHPAY_WEBHOOK_SECRET');

        if (! $secret) {
            $env = app()->environment();
            return in_array($env, ['local', 'testing'], true);
        }

        $signature = $request->header('X-Notch-Signature')
            ?? $request->header('X-Notchpay-Signature')
            ?? $request->header('X-Signature')
            ?? $request->input('signature');

        if (! $signature) {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), (string) $secret);

        return hash_equals($expected, (string) $signature);
    }
}
