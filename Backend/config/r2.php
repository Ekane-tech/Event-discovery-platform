<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudflare R2 Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration file provides the necessary settings for Cloudflare R2.
    | R2 is S3-compatible, so we use the S3 driver with R2-specific endpoint.
    |
    */

    'r2' => [
        'driver' => 's3',
        'key' => env('R2_ACCESS_KEY_ID'),
        'secret' => env('R2_SECRET_ACCESS_KEY'),
        'region' => env('R2_DEFAULT_REGION', 'auto'),
        'bucket' => env('R2_BUCKET'),
        'url' => env('R2_URL'),
        'endpoint' => env('R2_ENDPOINT'),
        'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
        'visibility' => 'public',
        'throw' => false,
        'report' => false,
    ],

];
