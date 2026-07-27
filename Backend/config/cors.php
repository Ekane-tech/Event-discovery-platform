<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // SÉCURITÉ : Gardez vos localhost ET votre domaine Vercel en dur si la variable env a un raté
        'allowed_origins' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174,https://mboaevents237.vercel.app','mboa-events-platform-staging.up.railway.app')))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // CONSEIL : Passez à true car votre intercepteur Axios envoie des en-têtes d'authentification
    'supports_credentials' => true,

];
