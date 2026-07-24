<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PayoutResource;
use App\Http\Resources\WalletTransactionResource;
use App\Models\Payout;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPayoutController extends Controller
{
    public function __construct(private readonly WalletService $walletService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Payout::query()->with(['organizer'])->latest();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $payouts = $query->paginate(min((int) $request->input('per_page', 15), 100));

        return response()->json([
            'payouts' => PayoutResource::collection($payouts),
        ]);
    }

    public function show(Payout $payout): JsonResponse
    {
        return response()->json([
            'payout' => new PayoutResource($payout->load(['organizer'])),
        ]);
    }

    public function approve(Payout $payout): JsonResponse
    {
        try {
            $this->walletService->approve($payout);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Payout approved.',
            'payout' => new PayoutResource($payout->fresh()),
        ]);
    }

    public function reject(Request $request, Payout $payout): JsonResponse
    {
        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->walletService->reject($payout, $validated['admin_notes'] ?? null);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Payout rejected.',
            'payout' => new PayoutResource($payout->fresh()),
        ]);
    }

    public function markPaid(Request $request, Payout $payout): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['nullable', 'string', 'max:191'],
        ]);

        try {
            $this->walletService->markPaid($payout, $request->user(), $validated['reference'] ?? null);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Payout marked as paid.',
            'payout' => new PayoutResource($payout->fresh()),
        ]);
    }

    /** Admin view of an organizer's wallet. */
    public function wallet(User $user): JsonResponse
    {
        $wallet = $this->walletService->ensureWallet($user);
        $transactions = \App\Models\WalletTransaction::query()
            ->where('organizer_id', $user->id)
            ->with(['event'])
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'organizer' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'wallet' => [
                ...$this->walletService->balances($user),
                'payout_method' => $wallet->payout_method,
                'payout_details' => $wallet->payout_details,
            ],
            'transactions' => WalletTransactionResource::collection($transactions),
        ]);
    }

    public function platformSettings(): JsonResponse
    {
        return response()->json([
            'settings' => [
                'platform_fee_percent' => (float) PlatformSetting::get('platform_fee_percent', 5),
                'payout_grace_hours' => (int) PlatformSetting::get('payout_grace_hours', 48),
                'min_payout_amount' => (float) PlatformSetting::get('min_payout_amount', 10000),
                'payout_currency' => (string) PlatformSetting::get('payout_currency', 'XAF'),
            ],
        ]);
    }

    public function updatePlatformSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform_fee_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'payout_grace_hours' => ['sometimes', 'integer', 'min:0'],
            'min_payout_amount' => ['sometimes', 'numeric', 'min:0'],
            'payout_currency' => ['sometimes', 'string', 'max:3'],
        ]);

        foreach ($validated as $key => $value) {
            PlatformSetting::set($key, $value);
        }

        return response()->json([
            'message' => 'Platform settings updated.',
            'settings' => [
                'platform_fee_percent' => (float) PlatformSetting::get('platform_fee_percent', 5),
                'payout_grace_hours' => (int) PlatformSetting::get('payout_grace_hours', 48),
                'min_payout_amount' => (float) PlatformSetting::get('min_payout_amount', 10000),
                'payout_currency' => (string) PlatformSetting::get('payout_currency', 'XAF'),
            ],
        ]);
    }
}
