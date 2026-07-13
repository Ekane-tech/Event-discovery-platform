<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('phone', 30)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('region', 120)->nullable();
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->string('preferred_language', 5)->default('en');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
