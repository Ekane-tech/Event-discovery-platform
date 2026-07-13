<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'operator')) {
                $table->string('operator', 30)->nullable()->after('provider');
            }
            if (! Schema::hasColumn('payments', 'phone_number')) {
                $table->string('phone_number', 30)->nullable()->after('operator');
            }
            if (! Schema::hasColumn('payments', 'external_reference')) {
                $table->string('external_reference', 191)->nullable()->after('reference');
            }
            if (! Schema::hasColumn('payments', 'provider_reference')) {
                $table->string('provider_reference', 191)->nullable()->after('external_reference');
            }
            if (! Schema::hasColumn('payments', 'failure_reason')) {
                $table->text('failure_reason')->nullable()->after('provider_reference');
            }
            if (! Schema::hasColumn('payments', 'callback_payload')) {
                $table->json('callback_payload')->nullable()->after('failure_reason');
            }
            if (! Schema::hasColumn('payments', 'initiated_at')) {
                $table->timestamp('initiated_at')->nullable()->after('callback_payload');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            foreach (['operator', 'phone_number', 'external_reference', 'provider_reference', 'failure_reason', 'callback_payload', 'initiated_at'] as $column) {
                if (Schema::hasColumn('payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
