<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Event;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AttendanceVerificationService
{
    private const EARTH_RADIUS_METERS = 6371000.0;

    /**
     * Calculate Haversine distance in meters between two GPS coordinates.
     */
    public function calculateDistanceMeters(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2,
    ): float {
        $latFrom = deg2rad($lat1);
        $lngFrom = deg2rad($lng1);
        $latTo = deg2rad($lat2);
        $lngTo = deg2rad($lng2);

        $latDelta = $latTo - $latFrom;
        $lngDelta = $lngTo - $lngFrom;

        $angle = 2 * asin(sqrt(
            pow(sin($latDelta / 2), 2)
            + cos($latFrom) * cos($latTo) * pow(sin($lngDelta / 2), 2)
        ));

        return round($angle * self::EARTH_RADIUS_METERS, 2);
    }

    public function isWithinVenueRadius(Event $event, float $lat, float $lng): bool
    {
        $distance = $this->calculateDistanceMeters(
            (float) $event->venue_lat,
            (float) $event->venue_lng,
            $lat,
            $lng,
        );

        return $distance <= $event->checkin_radius_meters;
    }

    /**
     * Perform QR + Geolocation check-in for a volunteer on a shift.
     *
     * @throws ValidationException
     */
    public function checkIn(
        User $user,
        string $qrToken,
        ?float $lat = null,
        ?float $lng = null,
    ): AttendanceLog {
        $shift = Shift::query()
            ->with(['event', 'division'])
            ->where('qr_token', trim($qrToken))
            ->first();

        if (! $shift) {
            throw ValidationException::withMessages([
                'qr_token' => 'Invalid or unrecognized shift QR code.',
            ]);
        }

        $isAssigned = $shift->volunteers()->where('users.id', $user->id)->exists();

        if (! $isAssigned) {
            throw ValidationException::withMessages([
                'qr_token' => 'You are not assigned to this shift ("'.$shift->title.'").',
            ]);
        }

        $existing = AttendanceLog::query()
            ->where('shift_id', $shift->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing && $existing->status === AttendanceLog::STATUS_COMPLETED) {
            throw ValidationException::withMessages([
                'qr_token' => 'Attendance for this shift is already completed ('.$existing->verified_hours.' hrs).',
            ]);
        }

        if ($existing && $existing->checked_in_at !== null) {
            throw ValidationException::withMessages([
                'qr_token' => 'You are already checked in to this shift. Use Check-Out when finished.',
            ]);
        }

        $verificationMethod = AttendanceLog::METHOD_QR;
        $status = AttendanceLog::STATUS_CHECKED_IN;

        if ($lat !== null && $lng !== null) {
            $distance = $this->calculateDistanceMeters(
                (float) $shift->event->venue_lat,
                (float) $shift->event->venue_lng,
                $lat,
                $lng,
            );

            if ($distance > $shift->event->checkin_radius_meters) {
                throw ValidationException::withMessages([
                    'location' => sprintf(
                        'You are %.0fm away from %s (allowed check-in radius: %dm). Move closer to the venue to check in.',
                        $distance,
                        $shift->event->venue_name,
                        $shift->event->checkin_radius_meters,
                    ),
                ]);
            }

            $verificationMethod = AttendanceLog::METHOD_QR_AND_GEO;
        }

        return AttendanceLog::query()->updateOrCreate(
            [
                'shift_id' => $shift->id,
                'user_id' => $user->id,
            ],
            [
                'checked_in_at' => now(),
                'checkin_lat' => $lat,
                'checkin_lng' => $lng,
                'verification_method' => $verificationMethod,
                'status' => $status,
            ],
        );
    }

    /**
     * Perform check-out and automatically compute verified service hours.
     *
     * @throws ValidationException
     */
    public function checkOut(User $user, Shift $shift): AttendanceLog
    {
        $log = AttendanceLog::query()
            ->where('shift_id', $shift->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $log || $log->checked_in_at === null) {
            throw ValidationException::withMessages([
                'shift_id' => 'You must check in before checking out of this shift.',
            ]);
        }

        if ($log->status === AttendanceLog::STATUS_COMPLETED) {
            return $log;
        }

        $checkedOutAt = now();
        $minutes = max(1, (int) $log->checked_in_at->diffInMinutes($checkedOutAt));
        $hours = round($minutes / 60, 2);

        $log->update([
            'checked_out_at' => $checkedOutAt,
            'verified_hours' => $hours,
            'status' => AttendanceLog::STATUS_COMPLETED,
        ]);

        return $log->fresh();
    }
}
