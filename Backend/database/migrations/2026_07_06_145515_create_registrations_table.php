<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('status', 50)->default('confirmed');
            $table->string('ticket_number', 191)->unique();
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
