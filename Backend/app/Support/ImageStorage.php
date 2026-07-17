<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageStorage
{
    public const DISK = 'public';

    /**
     * Store an uploaded image in the given directory on the public disk.
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
