<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191)->unique();
            $table->string('label', 191);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role_id')) {
                $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role_id')) {
                $table->dropForeign(['role_id']);
            }
        });

        Schema::dropIfExists('roles');
    }
};
