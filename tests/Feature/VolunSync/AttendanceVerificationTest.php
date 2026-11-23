<?php

namespace Tests\Feature\VolunSync;

use App\Models\AttendanceLog;
use App\Models\Division;
use App\Models\Event;
use App\Models\Shift;
use App\Models\User;
use App\Services\AttendanceVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AttendanceVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_haversine_distance_and_geofence_checkin_checkout(): void
    {
        $organizer = User::factory()->create();
        $volunteer = User::factory()->create();

        $event = Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'Sabuga Festival',
            'slug' => 'sabuga-festival',
            'description' => 'Festival event',
            'venue_name' => 'Sabuga ITB',
            'venue_lat' => -6.8868,
            'venue_lng' => 107.6085,
            'checkin_radius_meters' => 200,
            'start_date' => now()->setTime(8, 0),
            'end_date' => now()->setTime(18, 0),
            'status' => Event::STATUS_ONGOING,
        ]);

        $division = Division::create([
            'event_id' => $event->id,
            'name' => 'Operations',
            'quota' => 20,
        ]);

        $shift = Shift::create([
            'event_id' => $event->id,
            'division_id' => $division->id,
            'title' => 'Gate A Morning',
            'start_time' => now()->subHours(2),
            'end_time' => now()->addHours(2),
        ]);

        $shift->volunteers()->attach($volunteer->id, ['assigned_at' => now()->subDay()]);

        $service = new AttendanceVerificationService;

        // 1. Far away coordinates (~2km south) must be rejected
        try {
            $service->checkIn($volunteer, $shift->qr_token, -6.9050, 107.6085);
            $this->fail('Expected ValidationException for out-of-radius GPS check-in.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('location', $e->errors());
        }

        // 2. Within venue radius (~55m away) must succeed
        $log = $service->checkIn($volunteer, $shift->qr_token, -6.8872, 107.6085);
        $this->assertEquals(AttendanceLog::STATUS_CHECKED_IN, $log->status);
        $this->assertEquals(AttendanceLog::METHOD_QR_AND_GEO, $log->verification_method);

        // 3. Simulate 2 hours elapsed and check out
        $log->update(['checked_in_at' => now()->subMinutes(120)]);
        $completed = $service->checkOut($volunteer, $shift);

        $this->assertEquals(AttendanceLog::STATUS_COMPLETED, $completed->status);
        $this->assertEquals(2.0, $completed->verified_hours);
        $this->assertEquals(2.0, $volunteer->totalVerifiedHours());
    }
}

