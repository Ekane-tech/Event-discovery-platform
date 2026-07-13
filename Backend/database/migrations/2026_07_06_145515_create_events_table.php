<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->foreignId('division_id')->nullable()->constrained('divisions')->nullOnDelete();
            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->string('title', 191);
            $table->string('slug', 191)->unique();
            $table->longText('description');
            $table->string('venue', 191)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->dateTime('start_date');
            $table->dateTime('end_date')->nullable();
            $table->dateTime('registration_deadline')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('maximum_participants')->nullable();
            $table->enum('status', ['draft', 'pending', 'published', 'rejected', 'cancelled'])->default('draft');
            $table->enum('visibility', ['public', 'private'])->default('public');
            $table->unsignedInteger('views')->default(0);
            $table->timestamps();
            $table->index(['status', 'visibility', 'start_date']);
        });

        Schema::table('event_images', function (Blueprint $table) {
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('event_images', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
        });

        Schema::dropIfExists('events');
    }
};
