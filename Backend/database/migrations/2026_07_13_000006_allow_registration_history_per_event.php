<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('registrations')) {
            try {
                DB::statement('ALTER TABLE registrations DROP INDEX registrations_user_id_event_id_unique');
            } catch (Throwable $exception) {
                // Index may have already been removed on some databases.
            }

            try {
                DB::statement('CREATE INDEX registrations_user_event_status_index ON registrations (user_id, event_id, status)');
            } catch (Throwable $exception) {
                // Index may already exist.
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('registrations')) {
            try {
                DB::statement('DROP INDEX registrations_user_event_status_index ON registrations');
            } catch (Throwable $exception) {
                // Index may not exist.
            }

            try {
                DB::statement('ALTER TABLE registrations ADD UNIQUE registrations_user_id_event_id_unique (user_id, event_id)');
            } catch (Throwable $exception) {
                // Existing duplicate history can prevent restoring the unique index.
            }
        }
    }
};
