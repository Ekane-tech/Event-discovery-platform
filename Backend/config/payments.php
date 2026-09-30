<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Payment provider
    |--------------------------------------------------------------------------
    |
    |   - "mock"   : local development, no external calls (default)
    |   - "mesomb" : production — Cameroon mobile money (MTN / Orange) via
    |                MeSomb (https://mesomb.com, docs.mesomb.com)
    |
    | The user clicks "Pay" and the API responds in <1 second with
    | "Check your phone and confirm the prompt". The mobile-money charge
    | (the call that pushes the prompt to the phone) runs in a background
    | queue job (ProcessMeSombChargeJob). The final status arrives via the
    | async, signature-verified webhook (ProcessMeSombWebhookJob).
    |
    */

    'provider' => env('PAYMENT_PROVIDER', 'mock'),

    /*
    |--------------------------------------------------------------------------
    | MeSomb credentials
    |--------------------------------------------------------------------------
    |
    | Get these from the MeSomb dashboard (Account → Developer):
    |   - application key (X-MeSomb-Application)
    |   - access key + secret key (used to sign every request, HMAC-SHA1,
    |     same scheme as the official hachther/mesomb-php SDK)
    |   - webhook secret (whsec_...) shown once when the webhook endpoint is
    |     created in the MeSomb dashboard; used to verify the
    |     X-MeSomb-Webhook-Signature header on callbacks
    |
    */

    'mesomb' => [
        'application_key' => env('MESOMB_APPLICATION_KEY'),
        'access_key' => env('MESOMB_ACCESS_KEY'),
        'secret_key' => env('MESOMB_SECRET_KEY'),
        'webhook_secret' => env('MESOMB_WEBHOOK_SECRET'),
        'env' => env('MESOMB_ENV', 'PROD'),
        'base_url' => env('MESOMB_BASE_URL', 'https://mesomb.hachther.com'),
        // Timeout for MeSomb API calls, in seconds.
        'timeout' => (int) env('MESOMB_TIMEOUT', 60),
    ],

];
