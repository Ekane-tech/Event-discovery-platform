<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // FIX: Set this back to '*' or specify standard HTTP methods
    'allowed_methods' => ['*'],

    // FIX: Put your frontend URLs here instead
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:5174',
        env('FRONTEND_URL'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // TIP: Change to true if you plan to use Sanctum cookies for authentication later
    'supports_credentials' => false,

];
