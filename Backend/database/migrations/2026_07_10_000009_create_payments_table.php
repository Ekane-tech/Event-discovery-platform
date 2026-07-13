<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('registration_id')->nullable()->constrained('registrations')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('XAF');
            $table->string('status', 50)->default('pending');
            $table->string('provider', 50)->default('mock');
            $table->string('reference', 191)->unique();
            $table->json('metadata')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['event_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
