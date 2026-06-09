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
        Schema::create('reason_sub_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('reason_categories')->onDelete('cascade');
            $table->string('reason_text_en', 500)->nullable();
            $table->string('reason_text_id', 500)->nullable();
            $table->string('reason_text_th', 500)->nullable();
            $table->boolean('is_custom')->default(false);
            $table->integer('sort_order')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reason_sub_categories');
    }
};
