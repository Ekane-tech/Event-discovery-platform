<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('interest_matches')->default(true);
            $table->boolean('event_reminders')->default(true);
            $table->boolean('organizer_announcements')->default(true);
            $table->boolean('admin_messages')->default(true);
            $table->boolean('database')->default(true);
            $table->boolean('email')->default(true);
            $table->boolean('sms')->default(false);
            $table->boolean('push')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
