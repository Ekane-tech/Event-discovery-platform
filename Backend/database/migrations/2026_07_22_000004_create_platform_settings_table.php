<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('platform_settings')->insert([
            ['key' => 'platform_fee_percent', 'value' => '5.00', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'payout_grace_hours', 'value' => '48', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'min_payout_amount', 'value' => '10000', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'payout_currency', 'value' => 'XAF', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
