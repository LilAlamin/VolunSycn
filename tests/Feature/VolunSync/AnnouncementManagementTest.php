<?php

namespace Tests\Feature\VolunSync;

use App\Models\Announcement;
use App\Models\Application;
use App\Models\Division;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AnnouncementManagementTest extends TestCase
{
    use RefreshDatabase;

    private function seedRoles(): void
    {
        Role::firstOrCreate(['name' => 'organizer']);
        Role::firstOrCreate(['name' => 'coordinator']);
        Role::firstOrCreate(['name' => 'volunteer']);
    }

    /**
     * @return array{organizer: User, coordinatorA: User, coordinatorB: User, event: Event, divisionA: Division, divisionB: Division}
     */
    private function createScenario(): array
    {
        $this->seedRoles();

        $organizer = User::factory()->create();
        $organizer->assignRole('organizer');

        $coordinatorA = User::factory()->create();
        $coordinatorA->assignRole('coordinator');

        $coordinatorB = User::factory()->create();
        $coordinatorB->assignRole('coordinator');

        $event = Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'VolunSync Civic Expo',
            'slug' => 'volunsync-civic-expo-'.uniqid(),
            'description' => 'Annual civic expo',
            'venue_name' => 'Balai Kota',
            'venue_lat' => -6.912,
            'venue_lng' => 107.609,
            'checkin_radius_meters' => 250,
            'start_date' => now()->addDays(4),
            'end_date' => now()->addDays(5),
            'status' => Event::STATUS_OPEN,
        ]);

        $divisionA = Division::create([
            'event_id' => $event->id,
            'coordinator_id' => $coordinatorA->id,
            'name' => 'Logistics',
            'quota' => 10,
        ]);

        $divisionB = Division::create([
            'event_id' => $event->id,
            'coordinator_id' => $coordinatorB->id,
            'name' => 'Media',
            'quota' => 10,
        ]);

        return [
            'organizer' => $organizer,
            'coordinatorA' => $coordinatorA,
            'coordinatorB' => $coordinatorB,
            'event' => $event,
            'divisionA' => $divisionA,
            'divisionB' => $divisionB,
        ];
    }

    public function test_organizer_can_create_multiple_event_wide_and_division_announcements_and_manage_them(): void
    {
        ['organizer' => $organizer, 'event' => $event, 'divisionA' => $divisionA] = $this->createScenario();

        // 1. Event-wide announcement
        $this->actingAs($organizer)
            ->post('/admin/announcements', [
                'event_id' => $event->id,
                'division_id' => null,
                'title' => 'General Event Briefing',
                'body' => 'All volunteers gather at 07:00 WIB.',
                'is_pinned' => true,
            ])
            ->assertRedirect();

        // 2. Second announcement (division-specific) without creating/editing a division
        $this->actingAs($organizer)
            ->post('/admin/announcements', [
                'event_id' => $event->id,
                'division_id' => $divisionA->id,
                'title' => 'Logistics Truck Arrival',
                'body' => 'Equipment arrives at Gate B at 06:30.',
                'is_pinned' => false,
            ])
            ->assertRedirect();

        $this->assertSame(2, Announcement::count());

        $second = Announcement::where('title', 'Logistics Truck Arrival')->firstOrFail();

        // Update announcement
        $this->actingAs($organizer)
            ->put("/admin/announcements/{$second->id}", [
                'division_id' => $divisionA->id,
                'title' => 'Logistics Truck Arrival (Updated)',
                'body' => 'Moved to Gate C at 06:45.',
                'is_pinned' => true,
            ])
            ->assertRedirect();

        $this->assertSame('Logistics Truck Arrival (Updated)', $second->fresh()->title);
        $this->assertTrue($second->fresh()->is_pinned);

        // Delete announcement
        $this->actingAs($organizer)
            ->delete("/admin/announcements/{$second->id}")
            ->assertRedirect();

        $this->assertSame(1, Announcement::count());
    }

    public function test_coordinator_can_post_multiple_announcements_for_assigned_division_only(): void
    {
        ['organizer' => $organizer, 'coordinatorA' => $coordinatorA, 'event' => $event, 'divisionA' => $divisionA, 'divisionB' => $divisionB] = $this->createScenario();

        // Coordinator A posts 2 announcements to their assigned division A
        $this->actingAs($coordinatorA)
            ->post('/admin/announcements', [
                'division_id' => $divisionA->id,
                'title' => 'Shift Handover Checklist',
                'body' => 'Please verify radio batteries before shift start.',
            ])
            ->assertRedirect();

        $this->actingAs($coordinatorA)
            ->post('/admin/announcements', [
                'division_id' => $divisionA->id,
                'title' => 'Lunch Distribution Point',
                'body' => 'Lunch boxes are at Tent 2.',
                'is_pinned' => true,
            ])
            ->assertRedirect();

        $this->assertSame(2, Announcement::where('division_id', $divisionA->id)->count());

        // Coordinator A CANNOT post event-wide announcement
        $this->actingAs($coordinatorA)
            ->post('/admin/announcements', [
                'event_id' => $event->id,
                'division_id' => null,
                'title' => 'Unauthorized Broadcast',
                'body' => 'Should be forbidden.',
            ])
            ->assertForbidden();

        // Coordinator A CANNOT post to division B
        $this->actingAs($coordinatorA)
            ->post('/admin/announcements', [
                'division_id' => $divisionB->id,
                'title' => 'Wrong Division',
                'body' => 'Should be forbidden.',
            ])
            ->assertForbidden();

        // Organizer creates event-wide announcement; Coordinator A cannot edit or delete it
        $eventWide = Announcement::create([
            'event_id' => $event->id,
            'division_id' => null,
            'created_by' => $organizer->id,
            'title' => 'Organizer Notice',
            'body' => 'Read-only for coordinators.',
        ]);

        $this->actingAs($coordinatorA)
            ->put("/admin/announcements/{$eventWide->id}", [
                'title' => 'Hijacked',
                'body' => 'Nope',
            ])
            ->assertForbidden();

        $this->actingAs($coordinatorA)
            ->delete("/admin/announcements/{$eventWide->id}")
            ->assertForbidden();

        // Coordinator A can view /admin/announcements and sees both own division + read-only event-wide
        $this->actingAs($coordinatorA)
            ->get('/admin/announcements')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/announcements/Index')
                ->where('isOrganizer', false)
                ->has('announcements', 3)
            );
    }

    public function test_volunteer_workspace_displays_event_wide_and_own_division_announcements_only(): void
    {
        ['organizer' => $organizer, 'coordinatorA' => $coordinatorA, 'coordinatorB' => $coordinatorB, 'event' => $event, 'divisionA' => $divisionA, 'divisionB' => $divisionB] = $this->createScenario();

        $volunteer = User::factory()->create();
        $volunteer->assignRole('volunteer');

        Application::create([
            'user_id' => $volunteer->id,
            'event_id' => $event->id,
            'division_id' => $divisionA->id,
            'motivation' => 'Accepted member of Logistics division.',
            'status' => Application::STATUS_ACCEPTED,
        ]);

        Announcement::create([
            'event_id' => $event->id,
            'division_id' => null,
            'created_by' => $organizer->id,
            'title' => 'Event-Wide Welcome',
            'body' => 'Welcome everyone!',
            'is_pinned' => true,
        ]);

        Announcement::create([
            'event_id' => $event->id,
            'division_id' => $divisionA->id,
            'created_by' => $coordinatorA->id,
            'title' => 'Logistics Briefing',
            'body' => 'Bring gloves.',
            'is_pinned' => false,
        ]);

        Announcement::create([
            'event_id' => $event->id,
            'division_id' => $divisionB->id,
            'created_by' => $coordinatorB->id,
            'title' => 'Media Secret Note',
            'body' => 'Only for Media division.',
            'is_pinned' => false,
        ]);

        $this->actingAs($volunteer)
            ->get("/volunteer/workspace/{$divisionA->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('volunteer/Workspace')
                ->has('announcements', 2)
                ->where('announcements.0.title', 'Event-Wide Welcome')
                ->where('announcements.0.scope', 'event_wide')
                ->where('announcements.1.title', 'Logistics Briefing')
                ->where('announcements.1.scope', 'division_only')
            );
    }
}
