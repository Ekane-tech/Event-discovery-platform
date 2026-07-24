<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

/**
 * On-demand, cached image variants (thumbnails). Given a stored image path and
 * a target width, serve a resized JPEG. Variants are cached on the public disk
 * and served with immutable cache headers. On ANY failure (no GD, bad image,
 * etc.) it falls back to the original bytes — so it can never break the app or
 * the upload flow (uploads are untouched).
 */
class ImageVariantController extends Controller
{
    public function show(Request $request)
    {
        $path = (string) $request->query('path', '');
        $width = (int) $request->query('w', 800);

        // Validate path: no traversal, allowed image extensions only.
        if ($path === '' || str_contains($path, '..') || ! preg_match('#^[A-Za-z0-9_\-/]+\.(jpe?g|png|webp)$#i', $path)) {
            abort(404);
        }

        $width = max(80, min($width, 1600));

        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            abort(404);
        }

        $cacheRel = 'variants/'.$width.'/'.preg_replace('#[^A-Za-z0-9_\-]+#', '_', $path).'.jpg';

        if ($disk->exists($cacheRel)) {
            return $this->jpegResponse((string) $disk->get($cacheRel));
        }

        $bytes = $this->resize((string) $disk->path($path), $width);

        if ($bytes !== null) {
            try {
                $disk->put($cacheRel, $bytes);
            } catch (\Throwable) {
                // cache write failure is non-fatal
            }

            return $this->jpegResponse($bytes);
        }

        // Fallback: serve the original.
        return response((string) $disk->get($path), 200, [
            'Content-Type' => $this->mime($path),
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    protected function resize(string $absolutePath, int $maxWidth): ?string
    {
        try {
            if (! class_exists(ImageManager::class) || ! extension_loaded('gd')) {
                return null;
            }

            $manager = new ImageManager(new Driver());
            $image = $manager->read($absolutePath);

            try {
                $image->orientate(); // apply EXIF orientation (phone photos)
            } catch (\Throwable) {
                // ignore orientation failures
            }

            if ($image->width() > $maxWidth) {
                $image->scale(width: $maxWidth);
            }

            return (string) $image->toJpeg(80);
        } catch (\Throwable) {
            return null;
        }
    }

    protected function jpegResponse(string $bytes)
    {
        return response($bytes, 200, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    protected function mime(string $path): string
    {
        return match (strtolower((string) pathinfo($path, PATHINFO_EXTENSION))) {
            'png' => 'image/png',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };
    }
}
