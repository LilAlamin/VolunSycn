<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('city', 120)->nullable()->after('bio');
            $table->text('address')->nullable()->after('city');
            $table->date('date_of_birth')->nullable()->after('address');
            $table->string('emergency_contact_name', 160)->nullable()->after('date_of_birth');
            $table->string('emergency_contact_phone', 40)->nullable()->after('emergency_contact_name');
            $table->string('skills', 255)->nullable()->after('emergency_contact_phone');
            $table->timestamp('profile_verified_at')->nullable()->after('skills');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'city',
                'address',
                'date_of_birth',
                'emergency_contact_name',
                'emergency_contact_phone',
                'skills',
                'profile_verified_at',
            ]);
        });
    }
};

