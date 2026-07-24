<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PayoutResource;
use App\Http\Resources\WalletTransactionResource;
use App\Models\Payout;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private readonly WalletService $walletService)
    {
    }

    /** Organizer wallet summary: balances + saved payout method + rules. */
    public function show(Request $request): JsonResponse
    {
        $organizer = $request->user();
        $wallet = $this->walletService->ensureWallet($organizer);

        return response()->json([
            'wallet' => [
                ...$this->walletService->balances($organizer),
                'payout_method' => $wallet->payout_method,
                'payout_details' => $wallet->payout_details,
            ],
            'rules' => [
                'fee_percent' => $this->walletService->feePercent(),
                'grace_hours' => $this->walletService->graceHours(),
                'min_payout' => $this->walletService->minPayout(),
            ],
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $transactions = \App\Models\WalletTransaction::query()
            ->where('organizer_id', $request->user()->id)
            ->with(['event'])
            ->latest()
            ->paginate(min((int) $request->input('per_page', 15), 50));

        return response()->json([
            'transactions' => WalletTransactionResource::collection($transactions),
        ]);
    }

    /** Save the organizer's default payout method/destination. */
    public function updatePayoutMethod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'method' => ['required', 'in:mobile_money,bank'],
            'destination' => ['nullable', 'array'],
        ]);

        $wallet = $this->walletService->ensureWallet($request->user());
        $wallet->update([
            'payout_method' => $validated['method'],
            'payout_details' => $validated['destination'] ?? null,
        ]);

        return response()->json([
            'message' => 'Payout method saved.',
            'wallet' => [
                'payout_method' => $wallet->payout_method,
                'payout_details' => $wallet->payout_details,
            ],
        ]);
    }

    /** Request a withdrawal. */
    public function requestPayout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'method' => ['sometimes', 'in:mobile_money,bank'],
            'destination' => ['sometimes', 'array'],
        ]);

        try {
            $payout = $this->walletService->requestPayout($request->user(), $validated);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Payout requested. It will be reviewed shortly.',
            'payout' => new PayoutResource($payout),
            'wallet' => $this->walletService->balances($request->user()),
        ], 201);
    }

    public function payouts(Request $request): JsonResponse
    {
        $payouts = Payout::query()
            ->where('organizer_id', $request->user()->id)
            ->latest()
            ->paginate(min((int) $request->input('per_page', 15), 50));

        return response()->json([
            'payouts' => PayoutResource::collection($payouts),
        ]);
    }

    public function cancelPayout(Request $request, Payout $payout): JsonResponse
    {
        if ((int) $payout->organizer_id !== (int) $request->user()->id) {
            abort(403, 'This payout does not belong to you.');
        }

        try {
            $this->walletService->cancel($payout);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Payout request cancelled.',
            'payout' => new PayoutResource($payout->fresh()),
        ]);
    }
}
