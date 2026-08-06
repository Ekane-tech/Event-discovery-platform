<?php

namespace App\Console\Commands;

use App\Services\Payments\MeSomb\MeSombApiException;
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
        } catch (MeSombApiException $e) {
            $this->error('MeSomb connection failed: '.$e->getMessage()
                .' [HTTP '.$e->httpStatus.($e->apiCode !== '' ? ', code: '.$e->apiCode : '').']');

            if (str_contains(strtolower($e->getMessage()), 'not activated')) {
                $this->line('');
                $this->line('This is a MeSomb ACCOUNT-STATE error, not a code or credentials error:');
                $this->line('  the request signature was accepted, but the account has not been');
                $this->line('  activated yet on MeSomb\'s side.');
                $this->line('');
                $this->line('Fix it here:');
                $this->line('  1. Log in at https://business.mesomb.com');
                $this->line('  2. Verify your email address (click the activation link sent by MeSomb)');
                $this->line('     and your phone number (SMS code).');
                $this->line('  3. In "My Applications", open your application and submit the');
                $this->line('     GO-LIVE request to start accepting real mobile-money payments.');
                $this->line('     Approval can take a few hours.');
                $this->line('  4. Re-run this command — you should then see "MeSomb accepted the');
                $this->line('     credentials" plus your application info and balances.');
            }

            return self::FAILURE;
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
