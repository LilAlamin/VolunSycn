<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('organization_name')->nullable()->after('bio');
            $table->text('organization_description')->nullable()->after('organization_name');
            $table->foreignId('created_by_organizer_id')
                ->nullable()
                ->after('organization_description')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by_organizer_id');
            $table->dropColumn(['organization_name', 'organization_description']);
        });
    }
};

