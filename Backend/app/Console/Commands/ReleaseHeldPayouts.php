<?php

namespace App\Console\Commands;

use App\Services\Wallet\WalletService;
use Illuminate\Console\Command;

class ReleaseHeldPayouts extends Command
{
    protected $signature = 'payouts:release-held';

    protected $description = 'Release held organizer credits whose event ended past the grace period (and whose payment is still paid).';

    public function handle(WalletService $walletService): int
    {
        $released = $walletService->releaseHeldFunds();

        $this->info("Released {$released} held credit(s) to organizer wallets.");

        return self::SUCCESS;
    }
}
