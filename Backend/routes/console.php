<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Release held organizer credits to withdrawable once the event ended
// past the grace period (and the payment is still paid).
Schedule::command('payouts:release-held')->daily();
Schedule::command('events:send-reminders')->hourly();

// Nightly off-site-ready MySQL backup (7-day local rotation). Runs on the
// scheduler service. Auto-uploads to S3/B2 the moment AWS_* keys are set.
Schedule::command('backup:database')->dailyAt('02:00')->withoutOverlapping(600)->onOneServer();
