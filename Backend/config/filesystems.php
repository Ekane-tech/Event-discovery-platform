<?php

/*
|--------------------------------------------------------------------------
| Cloudflare R2 disk shape
|--------------------------------------------------------------------------
|
| R2 is S3-compatible with NO egress fees, so we use the S3 driver with
| the R2 endpoint. This array is shared by the explicit 'r2' disk and by
| the 'public' disk when R2 is configured (see below).
|
| The public URL defaults to the bucket-scoped R2 endpoint
| (https://<bucket>.<account-id>.r2.cloudflarestorage.com) which serves
| public bucket content directly. For production, set R2_URL to a custom
| domain (see CLOUDFLARE_R2_SETUP.md) — it always wins when present.
|
*/
$r2Disk = [
    'driver' => 's3',
    'key' => env('R2_ACCESS_KEY_ID'),
    'secret' => env('R2_SECRET_ACCESS_KEY'),
    'region' => env('R2_DEFAULT_REGION', 'auto'),
    'bucket' => env('R2_BUCKET'),
    'url' => env('R2_URL') ?: (env('R2_ENDPOINT') && env('R2_BUCKET')
        ? 'https://'.env('R2_BUCKET').'.'.preg_replace('#^https?://#', '', rtrim((string) env('R2_ENDPOINT'), '/'))
        : null),
    'endpoint' => env('R2_ENDPOINT'),
    'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
    'visibility' => 'public',
    'throw' => false,
    'report' => false,
];

// R2 is "live" once the operator sets R2_BUCKET + R2_ENDPOINT (+ R2_* keys)
// on Railway. No code changes needed anywhere else: every image path already
// goes through Storage::disk('public') (ImageStorage, the resources, the
// controllers, the variant cache, storage:migrate-s3), so flipping this one
// switch moves ALL image storage to Cloudflare R2.
$r2Configured = (bool) env('R2_BUCKET') && (bool) env('R2_ENDPOINT');

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        // Public uploads — the ONLY disk the app reads/writes images through.
        //
        //   • R2 configured (R2_BUCKET + R2_ENDPOINT set): this disk IS
        //     Cloudflare R2 (S3-compatible, no egress fees). Set the R2_*
        //     env vars on Railway and every upload/read/delete automatically
        //     goes to R2 — no code changes.
        //
        //   • Otherwise: local storage on the Railway volume, exactly as
        //     before this change.
        'public' => $r2Configured ? $r2Disk : [
            'driver' => 'local',
            'root' => env('RAILWAY_VOLUME_MOUNT_PATH', storage_path('app/public')),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        // Local disk rooted at the Railway volume — the SOURCE for the one-time
        // `storage:migrate-s3` command (copies existing uploads into the
        // 'public' disk, i.e. into R2 once it is configured).
        'local-uploads' => [
            'driver' => 'local',
            'root' => env('RAILWAY_VOLUME_MOUNT_PATH', storage_path('app/public')),
            'throw' => false,
            'report' => false,
        ],

        // Explicit Cloudflare R2 disk — same shape as the env-switched
        // 'public' disk above. Use it directly (e.g. FILESYSTEM_DISK=r2,
        // Storage::disk('r2')) when you want R2 without touching 'public'.
        'r2' => $r2Disk,

        // Private, volume-backed disk for database backups. Point BACKUP_DISK_PATH
        // at a persistent Railway volume mount (on the scheduler service). Never public.
        'backups' => [
            'driver' => 'local',
            'root' => env('BACKUP_DISK_PATH', storage_path('app/backups')),
            'throw' => true,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => env('RAILWAY_VOLUME_MOUNT_PATH', storage_path('app/public')),
    ],

];
