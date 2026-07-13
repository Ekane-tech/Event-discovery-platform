<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('visitor_key', 191);
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('viewed_at')->useCurrent();
            $table->timestamps();
            $table->unique(['event_id', 'visitor_key']);
            $table->index(['event_id', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_views');
    }
};
