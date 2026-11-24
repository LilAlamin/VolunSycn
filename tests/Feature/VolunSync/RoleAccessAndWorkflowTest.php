<?php

namespace Tests\Feature\VolunSync;

use App\Models\Application;
use App\Models\Division;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleAccessAndWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_rbac_isolation_and_workspace_unlock_on_acceptance(): void
    {
        Role::firstOrCreate(['name' => 'organizer']);
        Role::firstOrCreate(['name' => 'coordinator']);
        Role::firstOrCreate(['name' => 'volunteer']);

        $organizer = User::factory()->create();
        $organizer->assignRole('organizer');

        $coordinatorA = User::factory()->create();
        $coordinatorA->assignRole('coordinator');

        $coordinatorB = User::factory()->create();
        $coordinatorB->assignRole('coordinator');

        $volunteer = User::factory()->create();
        $volunteer->assignRole('volunteer');

        $event = Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'Bandung Civic Day',
            'slug' => 'bandung-civic-day',
            'description' => 'Community civic day',
            'venue_name' => 'Gedung Sate',
            'venue_lat' => -6.9024,
            'venue_lng' => 107.6188,
            'checkin_radius_meters' => 250,
            'start_date' => now()->addDays(3),
            'end_date' => now()->addDays(4),
            'status' => Event::STATUS_OPEN,
        ]);

        $divisionA = Division::create([
            'event_id' => $event->id,
            'coordinator_id' => $coordinatorA->id,
            'name' => 'Logistics',
            'quota' => 10,
        ]);

        // Volunteer cannot access admin dashboard
        $this->actingAs($volunteer)
            ->get('/admin/dashboard')
            ->assertForbidden();

        // Volunteer cannot access division workspace before acceptance
        $this->actingAs($volunteer)
            ->get("/volunteer/workspace/{$divisionA->id}")
            ->assertForbidden();

        Storage::fake('local');

        // Volunteer applies to division A
        $this->actingAs($volunteer)
            ->post('/volunteer/applications', [
                'division_id' => $divisionA->id,
                'motivation' => 'I want to help coordinate logistics and equipment for Bandung Civic Day.',
                'phone' => '081234567890',
                'cv' => UploadedFile::fake()->create('volunteer-cv.pdf', 120, 'application/pdf'),
            ])
            ->assertRedirect('/volunteer/applications');

        $application = Application::firstOrFail();

        // Coordinator B (not assigned to division A) cannot review division A's application
        $this->actingAs($coordinatorB)
            ->patch("/admin/applications/{$application->id}/review", [
                'status' => Application::STATUS_ACCEPTED,
            ])
            ->assertForbidden();

        // Coordinator A accepts the application
        $this->actingAs($coordinatorA)
            ->patch("/admin/applications/{$application->id}/review", [
                'status' => Application::STATUS_ACCEPTED,
                'reviewer_notes' => 'Welcome to Logistics!',
            ])
            ->assertRedirect();

        // Volunteer can now access division A workspace!
        $this->actingAs($volunteer)
            ->get("/volunteer/workspace/{$divisionA->id}")
            ->assertOk();
    }
}

