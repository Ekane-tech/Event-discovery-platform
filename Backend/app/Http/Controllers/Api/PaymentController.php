<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Services\Payments\MobileMoneyPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $payment = $paymentService->initiate($payment, $validated['operator'], $this->normalizePhoneNumber($validated['phone_number']));

        return response()->json([
            'message' => match ($payment->status) {
                'paid' => 'Payment completed successfully.',
                'failed' => 'Payment initiation failed.',
                default => 'Mobile money payment request initiated. Confirm the prompt on your phone.',
            },
            'payment' => new PaymentResource($payment->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ], $payment->status === 'failed' ? 422 : 200);
    }

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

        if ($payment->provider === 'campay') {
            $payment = $paymentService->refreshStatus($payment);

            return response()->json([
                'message' => $payment->status === 'paid'
                    ? 'Payment confirmed successfully.'
                    : 'Payment is still pending. Confirm the prompt on your phone, then check again.',
                'payment' => new PaymentResource($payment->load(['event.category', 'event.region', 'event.city', 'registration'])),
            ], $payment->status === 'failed' ? 422 : 200);
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'metadata' => [
                ...($payment->metadata ?? []),
                'development_confirmed_at' => now()->toISOString(),
                'development_confirmed_ip' => $request->ip(),
            ],
        ]);

        if ($payment->registration) {
            $payment->registration->update(['status' => 'confirmed']);
        }

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

        if ($payment->provider === 'campay' && in_array($payment->status, ['pending', 'processing'], true)) {
            $payment = $paymentService->refreshStatus($payment);
        }

        return response()->json([
            'payment' => new PaymentResource($payment->fresh()->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ]);
    }

    public function campayCallback(Request $request, MobileMoneyPaymentService $paymentService): JsonResponse
    {
        if (! $this->validCampayCallback($request)) {
            return response()->json(['message' => 'Invalid callback signature.'], 403);
        }

        $reference = $request->input('external_reference')
            ?? $request->input('reference')
            ?? $request->input('merchant_reference');

        if (! $reference) {
            return response()->json(['message' => 'Missing payment reference.'], 422);
        }

        $payment = Payment::where('reference', $reference)
            ->orWhere('external_reference', $reference)
            ->orWhere('provider_reference', $reference)
            ->firstOrFail();

        $payment = $paymentService->applyProviderStatus($payment, $request->all(), 'callback');

        return response()->json([
            'message' => 'Callback processed.',
            'status' => $payment->status,
        ]);
    }

    private function authorizePaymentOwner(Request $request, Payment $payment): void
    {
        if ((int) $payment->user_id !== (int) $request->user()->id) {
            abort(403, 'You do not have permission to access this payment.');
        }
    }

    private function normalizePhoneNumber(string $phoneNumber): string
    {
        $digits = preg_replace('/\D+/', '', $phoneNumber);

        if (str_starts_with($digits, '237')) {
            return '+'.$digits;
        }

        return '+237'.$digits;
    }

    private function validCampayCallback(Request $request): bool
    {
        $secret = env('CAMPAY_CALLBACK_SECRET');

        if (! $secret) {
            // Fail open only outside production so local/dev flows keep working.
            // In production an unsigned callback must never be trusted, otherwise
            // anyone could mark arbitrary payments as paid.
            return ! app()->environment('production');
        }

        $signature = $request->header('X-Campay-Signature')
            ?? $request->header('X-Signature')
            ?? $request->input('signature');

        if (! $signature) {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, (string) $signature);
    }
}
