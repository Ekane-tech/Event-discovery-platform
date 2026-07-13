<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
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

        if (! in_array($payment->status, ['pending', 'processing'], true)) {
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
            'message' => $payment->status === 'failed'
                ? 'Payment initiation failed.'
                : 'Mobile money payment request initiated.',
            'payment' => new PaymentResource($payment->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ], $payment->status === 'failed' ? 422 : 200);
    }

    public function confirm(Request $request, Payment $payment): JsonResponse
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

        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'metadata' => [
                ...($payment->metadata ?? []),
                'mock_confirmed_at' => now()->toISOString(),
                'mock_confirmed_ip' => $request->ip(),
            ],
        ]);

        if ($payment->registration) {
            $payment->registration->update(['status' => 'confirmed']);
        }

        return response()->json([
            'message' => 'Payment confirmed successfully.',
            'payment' => new PaymentResource($payment->fresh()->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ]);
    }

    public function status(Request $request, Payment $payment): JsonResponse
    {
        $this->authorizePaymentOwner($request, $payment);

        return response()->json([
            'payment' => new PaymentResource($payment->fresh()->load(['event.category', 'event.region', 'event.city', 'registration'])),
        ]);
    }

    public function campayCallback(Request $request): JsonResponse
    {
        $reference = $request->input('external_reference')
            ?? $request->input('reference')
            ?? $request->input('merchant_reference');

        if (! $reference) {
            return response()->json(['message' => 'Missing payment reference.'], 422);
        }

        $payment = Payment::where('reference', $reference)
            ->orWhere('external_reference', $reference)
            ->firstOrFail();

        $status = strtolower((string) ($request->input('status') ?? $request->input('payment_status')));
        $isPaid = in_array($status, ['successful', 'success', 'completed', 'paid'], true);

        $payment->update([
            'status' => $isPaid ? 'paid' : 'failed',
            'paid_at' => $isPaid ? now() : null,
            'failure_reason' => $isPaid ? null : ($request->input('message') ?? 'Payment failed.'),
            'callback_payload' => $request->all(),
        ]);

        if ($isPaid && $payment->registration) {
            $payment->registration->update(['status' => 'confirmed']);
        }

        return response()->json(['message' => 'Callback processed.']);
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
}
