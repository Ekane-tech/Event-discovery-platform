<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateStorageToS3 extends Command
{
    protected $signature = 'storage:migrate-s3';

    protected $description = 'Copy existing uploads from the local Railway volume (local-uploads disk) into the S3 public disk. Skips the regeneratable thumbnail cache. Idempotent.';

    public function handle(): int
    {
        $source = Storage::disk('local-uploads');
        $dest = Storage::disk('public'); // S3

        $files = $source->allFiles();
        $copied = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($files as $file) {
            // Skip the on-demand thumbnail cache (it regenerates automatically).
            if (str_starts_with($file, 'variants/')) {
                continue;
            }

            // Idempotent: skip files already present on S3.
            try {
                if ($dest->exists($file)) {
                    $skipped++;
                    continue;
                }
            } catch (\Throwable $e) {
                $this->error('Cannot reach S3 (check AWS_* env): '.$e->getMessage());

                return self::FAILURE;
            }

            try {
                $dest->put($file, $source->get($file));
                $copied++;
                if ($copied % 50 === 0) {
                    $this->info("  ...copied {$copied} files");
                }
            } catch (\Throwable $e) {
                $failed++;
                $this->warn("  failed: {$file} — ".$e->getMessage());
            }
        }

        $this->info("Migration complete — copied: {$copied}, skipped (already on S3): {$skipped}, failed: {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
