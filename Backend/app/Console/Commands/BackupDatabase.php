<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database';
    protected $description = 'Back up the MySQL database to a file and rotate old backups';

    public function handle()
    {
        $backupPath = config('app.backup_disk_path') ?? env('BACKUP_DISK_PATH', '/app/backups');
        
        // Ensure directory exists
        if (!is_dir($backupPath)) {
            mkdir($backupPath, 0755, true);
        }

        // Generate filename with timestamp
        $filename = 'database_' . now()->format('Y-m-d_H-i-s') . '.sql.gz';
        $filepath = $backupPath . '/' . $filename;

        // Build mysqldump command
        $host = env('DB_HOST', 'localhost');
        $port = env('DB_PORT', '3306');
        $user = env('DB_USERNAME');
        $password = env('DB_PASSWORD');
        $database = env('DB_DATABASE');

        $command = sprintf(
            'mysqldump --host=%s --port=%s --user=%s --password=%s %s | gzip > %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($user),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        try {
            $this->info("Starting database backup to {$filepath}...");
            
            $result = Process::run($command);

            if ($result->successful()) {
                $filesize = filesize($filepath);
                $this->info("✓ Database backed up successfully: {$filename} (" . $this->formatBytes($filesize) . ")");
            } else {
                $this->error("✗ Backup failed: " . $result->errorOutput());
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("✗ Error during backup: " . $e->getMessage());
            return 1;
        }

        // Rotate old backups (keep last 7 days)
        $this->rotateBackups($backupPath);

        return 0;
    }

    private function rotateBackups($backupPath)
    {
        $files = glob($backupPath . '/database_*.sql.gz');
        if (!$files) return;

        $cutoffTime = now()->subDays(7)->timestamp;
        $deleted = 0;

        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
                $deleted++;
            }
        }

        if ($deleted > 0) {
            $this->info("✓ Rotated {$deleted} old backup(s)");
        }
    }

    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}

