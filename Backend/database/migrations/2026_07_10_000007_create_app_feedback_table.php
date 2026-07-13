<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 191)->nullable();
            $table->string('email', 191)->nullable();
            $table->unsignedTinyInteger('rating');
            $table->string('category', 80)->default('general');
            $table->text('message')->nullable();
            $table->string('status', 50)->default('new');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_feedback');
    }
};
