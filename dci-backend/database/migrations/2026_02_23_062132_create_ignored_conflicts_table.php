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
        Schema::create('ignored_conflicts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_config_id');
            $table->string('database_name');
            $table->string('table_name');
            $table->string('column_name')->nullable();
            $table->string('conflict_type');
            $table->timestamps();

            $table->foreign('user_config_id')->references('id')->on('user_db_configs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ignored_conflicts');
    }
};
