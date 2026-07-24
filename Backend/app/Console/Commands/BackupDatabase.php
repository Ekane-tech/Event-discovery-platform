<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database
                            {--keep=7 : Number of days of local backups to retain}';

    protected $description = 'Dump the MySQL database to a gzipped SQL file, store it on the backups disk (and S3/B2 when configured), then rotate old local backups.';

    public function handle(): int
    {
        $default = (string) config('database.default');
        $driver = config("database.connections.{$default}.driver");

        if ($driver !== 'mysql') {
            $this->error("backup:database only supports MySQL. Default connection [{$default}] driver is [{$driver}].");
            return self::FAILURE;
        }

        if (! config('filesystems.disks.backups')) {
            $this->error("The 'backups' disk is not configured in config/filesystems.php.");
            return self::FAILURE;
        }

        $disk = Storage::disk('backups');
        $filename = 'mboa-events-'.now()->format('Y-m-d-His').'.sql.gz';

        try {
            $this->dumpTo($disk, $filename);
        } catch (\Throwable $e) {
            Log::error('Database backup failed during dump: '.$e->getMessage());
            $this->error('Backup failed: '.$e->getMessage());
            return self::FAILURE;
        }

        $locations = ['local:'.$filename];

        // Off-site upload — activates the moment AWS_*/AWS_BUCKET keys are set,
        // without any change to this script (S3 or S3-compatible e.g. Backblaze B2).
        if ($this->s3Configured()) {
            try {
                Storage::disk('s3')->writeStream($filename, $disk->readStream($filename));
                $locations[] = 's3:'.$filename;
            } catch (\Throwable $e) {
                // Local backup succeeded; off-site failure is non-fatal but loud.
                Log::warning('Database backup off-site upload failed: '.$e->getMessage());
                $this->warn('Off-site (S3/B2) upload failed — local backup still saved: '.$e->getMessage());
            }
        }

        $this->rotateLocal($disk, (int) $this->option('keep'));

        $this->info("Backup complete: {$filename}");
        foreach ($locations as $location) {
            $this->line("  - {$location}");
        }
        Log::info('Database backup complete: '.$filename.' -> '.implode(', ', $locations));

        return self::SUCCESS;
    }

    /**
     * Stream `mysqldump | gzip` straight to the backups disk (memory-safe) using
     * a temporary defaults-file so credentials never appear in the process list.
     */
    private function dumpTo($disk, string $filename): void
    {
        $conn = DB::connection();
        $host = (string) $conn->getConfig('host');
        $port = $conn->getConfig('port') ?: 3306;
        $user = (string) $conn->getConfig('username');
        $pass = (string) $conn->getConfig('password');
        $db = (string) $conn->getConfig('database');

        $cnf = tempnam(sys_get_temp_dir(), 'bkp_');
        $escape = static fn ($v) => addcslashes((string) $v, "\n\r\\");
        file_put_contents($cnf, "[client]\nuser=".$escape($user)."\npassword=".$escape($pass)."\nhost=".$escape($host)."\nport=".$escape($port)."\n");
        chmod($cnf, 0600);

        $absFinal = $disk->path($filename);
        $absTemp = $absFinal.'.tmp';
        $dir = dirname($absFinal);
        if (! is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $cmd = sprintf(
            'mysqldump --defaults-extra-file=%s --single-transaction --quick --no-tablespaces --routines --triggers --events %s | gzip > %s',
            escapeshellarg($cnf),
            escapeshellarg($db),
            escapeshellarg($absTemp)
        );

        $process = Process::fromShellCommandLine($cmd);
        $process->setTimeout(600);
        $process->run();

        @unlink($cnf);

        if (! $process->isSuccessful() || ! file_exists($absTemp) || filesize($absTemp) === 0) {
            @unlink($absTemp);
            throw new \RuntimeException('mysqldump failed: '.trim($process->getErrorOutput() ?: 'unknown error'));
        }

        rename($absTemp, $absFinal);
    }

    private function rotateLocal($disk, int $keepDays): void
    {
        $cutoff = now()->subDays($keepDays)->getTimestamp();

        foreach ($disk->files() as $file) {
            if (! str_ends_with($file, '.sql.gz')) {
                continue;
            }
            try {
                if ($disk->lastModified($file) < $cutoff) {
                    $disk->delete($file);
                    $this->line("  - rotated (older than {$keepDays}d): {$file}");
                }
            } catch (\Throwable $e) {
                Log::warning("Could not evaluate backup for rotation [{$file}]: ".$e->getMessage());
            }
        }
    }

    private function s3Configured(): bool
    {
        $cfg = config('filesystems.disks.s3', []);

        return ! empty($cfg['key']) && ! empty($cfg['bucket']);
    }
}
