<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Jobs\ProcessMeSombWebhookJob;
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
     * For MeSomb this is now FAST: no external HTTP call happens in the
     * request at all. The payment is marked "processing" and the charge
     * (the call that pushes the prompt to the phone) is queued as a
     * background job. The user gets the response in <1 second and sees
     * "Check your phone and confirm the prompt".
     *
     * The final status (paid/failed) comes from the async webhook.
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
     * User-facing "Confirm" button. Asks MeSomb for the current
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

        if (in_array($payment->provider, ['mesomb', 'notchpay'], true)) {
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

        if (in_array($payment->provider, ['mesomb', 'notchpay'], true)
            && in_array($payment->status, ['pending', 'processing'], true)) {
            $payment = $paymentService->refreshStatus($payment);
        }

        return response()->json([
            'payment' => new PaymentResource($payment->fresh()->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ]);
    }

    /**
     * MeSomb webhook receiver.
     *
     * Deliberately tiny so the response stays sub-100ms:
     *   1. Verify the X-MeSomb-Webhook-Signature HMAC (timestamp + raw body,
     *      5-minute tolerance).
     *   2. Extract the event type + payment reference.
     *   3. Enqueue ProcessMeSombWebhookJob.
     *   4. Return 200.
     *
     * All DB work and email side-effects happen in the queued job.
     */
    public function mesombCallback(Request $request): JsonResponse
    {
        if (! $this->validMeSombCallback($request)) {
            Log::warning('MeSomb webhook rejected: invalid signature.', [
                'ip' => $request->ip(),
                'has_header' => (bool) $request->header('X-MeSomb-Webhook-Signature'),
            ]);
            return response()->json(['message' => 'Invalid callback signature.'], 403);
        }

        $payload = $request->all();
        $eventType = (string) ($payload['type'] ?? $payload['event_type'] ?? '');
        $object = (array) ($payload['data']['object'] ?? []);

        // The webhook object carries our trxID/reference tag plus MeSomb's
        // own ids — match on any of them.
        $reference = $object['trxID']
            ?? $object['reference']
            ?? $object['pk']
            ?? $object['id']
            ?? $object['fin_trx_id'];

        if (! $reference) {
            Log::warning('MeSomb webhook rejected: missing payment reference.', [
                'event' => $eventType,
                'payload_keys' => array_keys($payload),
            ]);
            return response()->json(['message' => 'Missing payment reference.'], 422);
        }

        if ($eventType !== '' && ! str_starts_with($eventType, 'payment.')) {
            Log::info('MeSomb webhook ignored: non-payment event.', ['event' => $eventType]);
            return response()->json(['message' => 'Event ignored.'], 200);
        }

        try {
            ProcessMeSombWebhookJob::dispatch(
                (string) $reference,
                $payload,
                $eventType,
            );
        } catch (\Throwable $e) {
            // Queue is down — fail loud so MeSomb retries.
            Log::error('MeSomb webhook: failed to enqueue process job.', [
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
     * Verify the MeSomb webhook signature.
     *
     * Official scheme (docs.mesomb.com/development/webhooks/verifying-signatures):
     *   header:  X-MeSomb-Webhook-Signature: t=<timestamp>,v1=<hmac>
     *   payload: <timestamp>.<raw request body>
     *   hmac:    HMAC-SHA256(webhook_secret, payload), lowercase hex
     *   tolerance: 5 minutes (replay protection)
     *
     * The secret is generated once per webhook endpoint in the MeSomb
     * dashboard (whsec_...) and set as MESOMB_WEBHOOK_SECRET. In production
     * the secret MUST be set or we reject the request.
     */
    private function validMeSombCallback(Request $request): bool
    {
        $secret = config('payments.mesomb.webhook_secret');

        if (! $secret) {
            $env = app()->environment();
            return in_array($env, ['local', 'testing'], true);
        }

        $signatureHeader = (string) $request->header('X-MeSomb-Webhook-Signature', '');

        if ($signatureHeader === '') {
            return false;
        }

        $timestamp = null;
        $signature = null;

        foreach (explode(',', $signatureHeader) as $part) {
            if (str_starts_with($part, 't=')) {
                $timestamp = substr($part, 2);
            } elseif (str_starts_with($part, 'v1=')) {
                $signature = substr($part, 3);
            }
        }

        if ($timestamp === null || $signature === null || ! ctype_digit($timestamp)) {
            return false;
        }

        // Reject replays older than 5 minutes.
        if (abs(time() - (int) $timestamp) > 300) {
            Log::warning('MeSomb webhook rejected: signature timestamp outside tolerance.', [
                'timestamp' => $timestamp,
            ]);
            return false;
        }

        $signedPayload = $timestamp.'.'.$request->getContent();
        $expected = hash_hmac('sha256', $signedPayload, (string) $secret);

        return hash_equals($expected, strtolower((string) $signature));
    }
}
