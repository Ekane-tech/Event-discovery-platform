<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    // CORRECTION : On ajoute '*' pour couvrir absolument TOUTES les routes (api, auth, login, etc.)
    'paths' => ['api/*', 'sanctum/csrf-cookie', '*'],

    'allowed_methods' => ['*'],

    // SÉCURITÉ : Gardez vos localhost ET votre domaine Vercel en dur si la variable env a un raté
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://mboaevents237.vercel.app'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // CONSEIL : Passez à true car votre intercepteur Axios envoie des en-têtes d'authentification
    'supports_credentials' => true,

];
