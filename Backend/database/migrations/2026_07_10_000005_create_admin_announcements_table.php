<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 191);
            $table->text('message');
            $table->string('audience', 50)->default('users');
            $table->string('status', 50)->default('draft');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index(['audience', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_announcements');
    }
};
