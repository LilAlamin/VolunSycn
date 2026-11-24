<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->string('cv_path')->nullable()->after('motivation');
            $table->string('cv_original_name')->nullable()->after('cv_path');
            $table->string('phone', 30)->nullable()->after('cv_original_name');
            $table->string('instagram', 255)->nullable()->after('phone');
            $table->string('linkedin', 255)->nullable()->after('instagram');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'cv_path',
                'cv_original_name',
                'phone',
                'instagram',
                'linkedin',
            ]);
        });
    }
};
