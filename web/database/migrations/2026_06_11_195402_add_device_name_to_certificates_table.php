<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * SAFE: Only adds nullable columns — existing certificate data is preserved.
     */
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            // Label perangkat yang ditampilkan ke pengguna (misal: "MacBook Air", "PC Kantor")
            $table->string('device_name', 128)->nullable()->after('subject_cn');
            // Identifier unik per-perangkat untuk keperluan matching di Extension
            $table->string('device_identifier', 64)->nullable()->after('device_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['device_name', 'device_identifier']);
        });
    }
};

