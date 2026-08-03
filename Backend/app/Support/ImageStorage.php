<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class ImageStorage
{
    public const DISK = 'public';

    /**
     * Store an uploaded image in the given directory on the public disk.
     *
     * Wraps the underlying store() call so that permission errors, missing
     * volume mounts, or disk space issues are logged with enough detail to
     * debug instead of failing silently.
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        $diskRoot = config('filesystems.disks.'.self::DISK.'.root');

        try {
            $path = $file->store($directory, self::DISK);
        } catch (Throwable $exception) {
            Log::error('ImageStorage::store threw an exception while saving the uploaded file.', [
                'disk' => self::DISK,
                'disk_root' => $diskRoot,
                'directory' => $directory,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        if (! is_string($path) || $path === '') {
            Log::error('ImageStorage::store failed to save the uploaded file. The disk returned no path.', [
                'disk' => self::DISK,
                'disk_root' => $diskRoot,
                'directory' => $directory,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'disk_root_exists' => $diskRoot ? is_dir($diskRoot) : false,
                'disk_root_writable' => $diskRoot ? is_writable($diskRoot) : false,
            ]);

            throw new RuntimeException(
                "Failed to store uploaded file in directory [{$directory}] on disk [".self::DISK.']. Check that the disk root path exists and is writable.'
            );
        }

        return $path;
    }

    /**
     * Assert that the configured disk root directory exists and is writable.
     * Call this before attempting an upload to surface volume mount or
     * permission problems immediately, with a clear error message.
     */
    public static function ensureDiskIsWritable(): void
    {
        $diskRoot = config('filesystems.disks.'.self::DISK.'.root');

        if (! $diskRoot) {
            Log::error('ImageStorage disk root path is not configured.', ['disk' => self::DISK]);

            throw new RuntimeException('Image storage disk root path is not configured. Check the RAILWAY_VOLUME_MOUNT_PATH environment variable.');
        }

        if (! is_dir($diskRoot)) {
            Log::error('ImageStorage disk root directory does not exist.', [
                'disk' => self::DISK,
                'disk_root' => $diskRoot,
            ]);

            throw new RuntimeException("Image storage directory [{$diskRoot}] does not exist. Verify the volume is mounted and RAILWAY_VOLUME_MOUNT_PATH is correct.");
        }

        if (! is_writable($diskRoot)) {
            Log::error('ImageStorage disk root directory is not writable.', [
                'disk' => self::DISK,
                'disk_root' => $diskRoot,
            ]);

            throw new RuntimeException("Image storage directory [{$diskRoot}] is not writable. Check filesystem permissions on the mounted volume.");
        }
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
