<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('divisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained('regions')->cascadeOnDelete();
            $table->string('name', 191);
            $table->string('slug', 191);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['region_id', 'name']);
        });

        Schema::table('cities', function (Blueprint $table) {
            $table->foreign('division_id')->references('id')->on('divisions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
        });

        Schema::dropIfExists('divisions');
    }
};
