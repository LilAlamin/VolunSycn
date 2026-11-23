<?php

namespace Tests\Feature\VolunSync;

use App\Models\Division;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RegistrationAndMultiOrgTest extends TestCase
{
    use RefreshDatabase;

    public function test_two_role_public_registration_and_coordinator_blocking(): void
    {
        // 1. Volunteer registration succeeds
        $this->post('/register', [
            'account_type' => 'volunteer',
            'name' => 'Raka Pratama',
            'email' => 'raka@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertRedirect();

        $volunteer = User::where('email', 'raka@example.com')->firstOrFail();
        $this->assertTrue($volunteer->hasRole('volunteer'));
        $this->assertNull($volunteer->organization_name);

        auth()->logout();

        // 2. Organizer registration requires organization_name
        $this->post('/register', [
            'account_type' => 'organizer',
            'name' => 'Siti Organiser',
            'email' => 'siti@org.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertSessionHasErrors('organization_name');

        // 3. Organizer registration with organization_name succeeds
        $this->post('/register', [
            'account_type' => 'organizer',
            'name' => 'Siti Organiser',
            'email' => 'siti@org.test',
            'organization_name' => 'SIPA Surakarta',
            'organization_description' => 'Performing arts festival collective',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertRedirect();

        $organizer = User::where('email', 'siti@org.test')->firstOrFail();
        $this->assertTrue($organizer->hasRole('organizer'));
        $this->assertEquals('SIPA Surakarta', $organizer->organization_name);

        auth()->logout();

        // 4. Public self-registration as coordinator is strictly rejected
        $this->post('/register', [
            'account_type' => 'coordinator',
            'name' => 'Sneaky Coord',
            'email' => 'sneaky@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertSessionHasErrors('account_type');
    }

    public function test_organizer_scoping_and_coordinator_provisioning(): void
    {
        Role::firstOrCreate(['name' => 'organizer']);
        Role::firstOrCreate(['name' => 'coordinator']);

        $orgA = User::factory()->create(['organization_name' => 'Org Alpha']);
        $orgA->assignRole('organizer');

        $orgB = User::factory()->create(['organization_name' => 'Org Beta']);
        $orgB->assignRole('organizer');

        $eventA = Event::create([
            'organizer_id' => $orgA->id,
            'title' => 'Alpha Cultural Fest',
            'slug' => 'alpha-cultural-fest',
            'description' => 'Alpha event',
            'venue_name' => 'City Hall',
            'venue_lat' => -7.5666,
            'venue_lng' => 110.8167,
            'checkin_radius_meters' => 200,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(6),
            'status' => Event::STATUS_OPEN,
        ]);

        $divisionA = Division::create([
            'event_id' => $eventA->id,
            'name' => 'Stage Ops',
            'quota' => 15,
        ]);

        // Organizer B cannot edit Organizer A's event
        $this->actingAs($orgB)
            ->put("/admin/events/{$eventA->id}", [
                'title' => 'Hijacked Event',
                'description' => 'Nope',
                'venue_name' => 'Nowhere',
                'venue_lat' => 0,
                'venue_lng' => 0,
                'checkin_radius_meters' => 100,
                'start_date' => now()->addDays(5)->toDateTimeString(),
                'end_date' => now()->addDays(6)->toDateTimeString(),
                'status' => Event::STATUS_OPEN,
            ])
            ->assertForbidden();

        // Organizer A can provision a new Coordinator bound to orgA and assigned to divisionA
        $this->actingAs($orgA)
            ->post('/admin/coordinators', [
                'name' => 'Budi Coordinator',
                'email' => 'budi.coord@alpha.test',
                'password' => 'TempPass123!',
                'division_id' => $divisionA->id,
            ])
            ->assertRedirect();

        $coord = User::where('email', 'budi.coord@alpha.test')->firstOrFail();
        $this->assertTrue($coord->hasRole('coordinator'));
        $this->assertEquals($orgA->id, $coord->created_by_organizer_id);
        $this->assertEquals($coord->id, $divisionA->fresh()->coordinator_id);
    }
}

