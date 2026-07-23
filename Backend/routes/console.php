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
