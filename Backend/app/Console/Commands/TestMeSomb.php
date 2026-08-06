<?php

namespace App\Console\Commands;

use App\Services\Payments\MeSomb\MeSombClient;
use Illuminate\Console\Command;
use Throwable;

/**
 * Quick MeSomb connectivity/credential check.
 *
 * Calls MeSomb GET payment/status/ (application info + balances) with the
 * configured MESOMB_* credentials. This is the SAFEST possible first test:
 * it authenticates against MeSomb without moving any money or pushing any
 * prompt to a phone.
 *
 *   php artisan payments:test-mesomb
 *
 * Optionally look up existing transactions by their MeSomb pk:
 *
 *   php artisan payments:test-mesomb --transactions="<pk1>,<pk2>"
 */
class TestMeSomb extends Command
{
    protected $signature = 'payments:test-mesomb {--transactions= : Comma-separated MeSomb transaction ids to look up}';

    protected $description = 'Verify MeSomb credentials and connectivity (GET payment/status/). Does NOT charge anything.';

    public function handle(): int
    {
        $settings = config('payments.mesomb', []);

        $missing = [];
        foreach (['application_key', 'access_key', 'secret_key'] as $key) {
            if (empty($settings[$key])) {
                $missing[] = 'MESOMB_'.strtoupper($key);
            }
        }

        if ($missing) {
            $this->error('Missing MeSomb configuration: '.implode(', ', $missing).'.');
            $this->line('Set them in your .env / Railway variables and run again.');

            return self::FAILURE;
        }

        $baseUrl = (string) ($settings['base_url'] ?? 'https://mesomb.hachther.com');
        $client = new MeSombClient(
            (string) $settings['application_key'],
            (string) $settings['access_key'],
            (string) $settings['secret_key'],
            $baseUrl,
            (int) ($settings['timeout'] ?? 60),
        );

        try {
            $status = $client->getStatus();
        } catch (Throwable $e) {
            $this->error('MeSomb connection failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('✓ MeSomb accepted the credentials ('.rtrim($baseUrl, '/').').');
        $this->line('  Application : '.($status['name'] ?? '(n/a)').' ('.($status['key'] ?? '(n/a)').')');
        $this->line('  Status      : '.($status['status'] ?? '(n/a)'));
        $this->line('  Description : '.($status['description'] ?? '(n/a)'));
        $this->line('  URL         : '.($status['url'] ?? '(n/a)'));

        if (! empty($status['countries']) && is_array($status['countries'])) {
            $this->line('  Countries   : '.implode(', ', array_map('strval', $status['countries'])));
        }

        if (! empty($status['balances']) && is_array($status['balances'])) {
            $this->line('  Balances:');
            foreach ($status['balances'] as $balance) {
                if (! is_array($balance)) {
                    continue;
                }
                $this->line(sprintf(
                    '    - %s (%s): %s %s',
                    $balance['provider'] ?? $balance['service_name'] ?? '(provider n/a)',
                    $balance['country'] ?? '?',
                    $balance['value'] ?? '?',
                    $balance['currency'] ?? ''
                ));
            }
        } else {
            $this->line('  Balances    : (none returned)');
        }

        $this->line('  Webhook secret: '.(empty($settings['webhook_secret']) ? 'NOT SET' : 'set ✓'));

        if ($transactions = $this->option('transactions')) {
            $ids = array_values(array_filter(array_map('trim', explode(',', (string) $transactions))));

            if ($ids === []) {
                $this->warn('--transactions was empty; nothing to look up.');
            } else {
                try {
                    foreach ($client->getTransactions($ids) as $tx) {
                        if (! is_array($tx)) {
                            continue;
                        }
                        $this->line(sprintf(
                            '  TX %s: %s %s — %s (%s)',
                            $tx['pk'] ?? '?',
                            $tx['amount'] ?? '?',
                            $tx['currency'] ?? '',
                            $tx['status'] ?? '?',
                            $tx['service'] ?? '?'
                        ));
                    }
                } catch (Throwable $e) {
                    $this->warn('Transaction lookup failed: '.$e->getMessage());
                }
            }
        }

        return self::SUCCESS;
    }
}
