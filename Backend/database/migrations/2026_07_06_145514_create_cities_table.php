<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->unsignedBigInteger('division_id')->nullable()->index();
            $table->string('name', 191);
            $table->string('slug', 191);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['region_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
