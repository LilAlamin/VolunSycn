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

    public function test_organizer_can_duplicate_event_with_divisions_and_others_are_forbidden(): void
    {
        Role::firstOrCreate(['name' => 'organizer']);
        Role::firstOrCreate(['name' => 'coordinator']);

        $organizer = User::factory()->create();
        $organizer->assignRole('organizer');

        $otherOrganizer = User::factory()->create();
        $otherOrganizer->assignRole('organizer');

        $coordinator = User::factory()->create();
        $coordinator->assignRole('coordinator');

        $event = Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'Bandung Heritage Festival',
            'slug' => 'bandung-heritage-festival',
            'description' => 'Annual community festival.',
            'venue_name' => 'Sabuga ITB',
            'venue_lat' => -6.8868,
            'venue_lng' => 107.6085,
            'checkin_radius_meters' => 300,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(6),
            'status' => Event::STATUS_OPEN,
        ]);

        Division::create([
            'event_id' => $event->id,
            'coordinator_id' => $coordinator->id,
            'name' => 'Stage Operations',
            'description' => 'Manage stage transitions.',
            'announcements' => 'Bring walkie-talkies.',
            'quota' => 20,
        ]);

        Division::create([
            'event_id' => $event->id,
            'coordinator_id' => null,
            'name' => 'Guest Hospitality',
            'description' => 'Welcome attendees.',
            'announcements' => null,
            'quota' => 15,
        ]);

        // Coordinator and another Organizer cannot duplicate this event
        $this->actingAs($coordinator)
            ->post("/admin/events/{$event->id}/duplicate")
            ->assertForbidden();

        $this->actingAs($otherOrganizer)
            ->post("/admin/events/{$event->id}/duplicate")
            ->assertForbidden();

        // Owning Organizer duplicates event + all divisions as draft
        $this->actingAs($organizer)
            ->post("/admin/events/{$event->id}/duplicate")
            ->assertRedirect();

        $duplicated = Event::query()
            ->where('id', '!=', $event->id)
            ->where('organizer_id', $organizer->id)
            ->with('divisions')
            ->firstOrFail();

        $this->assertSame('Bandung Heritage Festival (Copy)', $duplicated->title);
        $this->assertSame(Event::STATUS_DRAFT, $duplicated->status);
        $this->assertNotSame($event->slug, $duplicated->slug);
        $this->assertCount(2, $duplicated->divisions);
        $this->assertSame(
            ['Guest Hospitality', 'Stage Operations'],
            $duplicated->divisions->pluck('name')->sort()->values()->all(),
        );
        $stageCopy = $duplicated->divisions->firstWhere('name', 'Stage Operations');
        $this->assertSame(20, $stageCopy->quota);
        $this->assertSame($coordinator->id, $stageCopy->coordinator_id);
        $this->assertSame('Bring walkie-talkies.', $stageCopy->announcements);
    }
}

