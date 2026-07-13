<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->cascadeOnDelete();
            $table->string('type', 100);
            $table->text('message')->nullable();
            $table->string('status', 50)->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
