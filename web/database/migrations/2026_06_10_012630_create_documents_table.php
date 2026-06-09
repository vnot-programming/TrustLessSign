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
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('certificate_id')->constrained()->onDelete('cascade');
            $table->foreignId('reason_sub_category_id')->nullable()->constrained('reason_sub_categories')->onDelete('set null');
            $table->text('gdrive_url_signed')->nullable();
            $table->boolean('is_saved_to_drive')->default(false);
            $table->string('original_filename', 500);
            $table->string('verify_token', 128)->unique();
            $table->string('doc_hash_sha256', 64);
            $table->jsonb('qr_position')->nullable();
            $table->string('reason_final', 1000)->nullable();
            $table->timestamp('signed_at')->useCurrent();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
