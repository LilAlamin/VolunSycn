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
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('coordinator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('announcements')->nullable();
            $table->unsignedInteger('quota')->default(10);
            $table->timestamps();

            $table->index(['event_id', 'coordinator_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('divisions');
    }
};
