<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('signature_name');
            $table->string('original_filename');
            $table->string('file_path', 500);
            $table->string('optimized_path', 500)->nullable();
            $table->string('mime_type', 50);
            $table->unsignedInteger('file_size');
            $table->unsignedInteger('width');
            $table->unsignedInteger('height');
            $table->string('file_hash', 64)->unique();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_signatures');
    }
};
