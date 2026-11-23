<?php

namespace Tests\Feature\VolunSync;

use App\Models\Division;
use App\Models\Event;
use App\Models\Shift;
use App\Models\User;
use App\Services\ShiftConflictService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ShiftConflictServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_prevents_overlapping_shift_assignment(): void
    {
        $organizer = User::factory()->create();
        $volunteer = User::factory()->create();

        $event = Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'Community Cleanup',
            'slug' => 'community-cleanup',
            'description' => 'River cleanup event',
            'venue_name' => 'Taman Cikapundung',
            'venue_lat' => -6.9016,
            'venue_lng' => 107.6097,
            'checkin_radius_meters' => 250,
            'start_date' => now()->addDay()->setTime(7, 0),
            'end_date' => now()->addDay()->setTime(17, 0),
            'status' => Event::STATUS_OPEN,
        ]);

        $divisionA = Division::create([
            'event_id' => $event->id,
            'name' => 'Logistics',
            'quota' => 10,
        ]);

        $divisionB = Division::create([
            'event_id' => $event->id,
            'name' => 'Media',
            'quota' => 10,
        ]);

        $morningShift = Shift::create([
            'event_id' => $event->id,
            'division_id' => $divisionA->id,
            'title' => 'Morning Setup',
            'start_time' => now()->addDay()->setTime(8, 0),
            'end_time' => now()->addDay()->setTime(12, 0),
        ]);

        $overlappingShift = Shift::create([
            'event_id' => $event->id,
            'division_id' => $divisionB->id,
            'title' => 'Midday Coverage',
            'start_time' => now()->addDay()->setTime(11, 0),
            'end_time' => now()->addDay()->setTime(14, 0),
        ]);

        $backToBackShift = Shift::create([
            'event_id' => $event->id,
            'division_id' => $divisionB->id,
            'title' => 'Afternoon Coverage',
            'start_time' => now()->addDay()->setTime(12, 0),
            'end_time' => now()->addDay()->setTime(16, 0),
        ]);

        $service = new ShiftConflictService;
        $service->assignVolunteer($morningShift, $volunteer);

        $this->assertTrue($service->hasConflict($volunteer, $overlappingShift));
        $this->assertFalse($service->hasConflict($volunteer, $backToBackShift));

        // Overlapping shift must throw ValidationException
        try {
            $service->assignVolunteer($overlappingShift, $volunteer);
            $this->fail('Expected ValidationException was not thrown for overlapping shift.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('user_id', $e->errors());
        }

        // Non-overlapping back-to-back shift must succeed
        $service->assignVolunteer($backToBackShift, $volunteer);
        $this->assertEquals(2, $volunteer->shifts()->count());
    }
}

