<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizer_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('currency', 3)->default('XAF');
            $table->string('payout_method', 20)->nullable(); // mobile_money | bank
            $table->json('payout_details')->nullable();       // {operator,number} | {bank_name,account_name,account_number}
            $table->timestamps();
            $table->unique('user_id'); // one wallet per organizer
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizer_wallets');
    }
};
