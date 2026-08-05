<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageStorage
{
    /**
     * Disk used for every image the app stores.
     *
     * This is intentionally the 'public' disk and never changes: the disk
     * itself is env-switchable (see config/filesystems.php). When R2_BUCKET
     * + R2_ENDPOINT + R2_* credentials are set on Railway, 'public' IS
     * Cloudflare R2 (S3-compatible, no egress fees) and all images go there
     * automatically — no operator-side code changes needed.
     */
    public const DISK = 'public';

    /**
     * Store an uploaded image in the given directory on the public disk
     * (Cloudflare R2 when configured, local storage otherwise).
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, self::DISK);
    }

    /**
     * Delete a stored image, ignoring empty paths and externally hosted URLs.
     */
    public static function delete(?string $path): void
    {
        if ($path && ! self::isExternal($path)) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    /**
     * Store a new image and delete the previous one. When no new file is
     * provided the current path is returned unchanged.
     */
    public static function replace(?UploadedFile $file, string $directory, ?string $currentPath): ?string
    {
        if (! $file) {
            return $currentPath;
        }

        self::delete($currentPath);

        return self::store($file, $directory);
    }

    /**
     * Determine whether a path points at an externally hosted image.
     */
    public static function isExternal(?string $path): bool
    {
        return is_string($path) && str_starts_with($path, 'http');
    }
}
