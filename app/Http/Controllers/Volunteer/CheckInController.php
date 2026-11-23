<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckInRequest;
use App\Models\AttendanceLog;
use App\Models\Shift;
use App\Services\AttendanceVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $logsByShift = AttendanceLog::query()
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('shift_id');

        $assignedShifts = $user->shifts()
            ->with(['event:id,title,venue_name,venue_lat,venue_lng,checkin_radius_meters', 'division:id,name'])
            ->orderBy('start_time')
            ->get()
            ->map(function (Shift $shift) use ($logsByShift): array {
                $log = $logsByShift->get($shift->id);

                return [
                    'id' => $shift->id,
                    'title' => $shift->title,
                    'location' => $shift->location,
                    'start_time' => $shift->start_time->toIso8601String(),
                    'end_time' => $shift->end_time->toIso8601String(),
                    'qr_token' => $shift->qr_token,
                    'division_name' => $shift->division->name,
                    'event' => [
                        'id' => $shift->event->id,
                        'title' => $shift->event->title,
                        'venue_name' => $shift->event->venue_name,
                        'venue_lat' => $shift->event->venue_lat,
                        'venue_lng' => $shift->event->venue_lng,
                        'checkin_radius_meters' => $shift->event->checkin_radius_meters,
                    ],
                    'attendance' => $log ? [
                        'id' => $log->id,
                        'status' => $log->status,
                        'checked_in_at' => $log->checked_in_at?->toIso8601String(),
                        'checked_out_at' => $log->checked_out_at?->toIso8601String(),
                        'verification_method' => $log->verification_method,
                        'verified_hours' => $log->verified_hours,
                    ] : null,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('volunteer/CheckIn', [
            'assignedShifts' => $assignedShifts,
            'totalVerifiedHours' => $user->totalVerifiedHours(),
        ]);
    }

    public function checkIn(CheckInRequest $request, AttendanceVerificationService $service): RedirectResponse
    {
        $log = $service->checkIn(
            $request->user(),
            $request->string('qr_token')->toString(),
            $request->filled('lat') ? (float) $request->input('lat') : null,
            $request->filled('lng') ? (float) $request->input('lng') : null,
        );

        return back()->with('success', 'Checked in successfully! Verification: '.strtoupper(str_replace('_', ' + ', $log->verification_method)));
    }

    public function checkOut(Request $request, Shift $shift, AttendanceVerificationService $service): RedirectResponse
    {
        $log = $service->checkOut($request->user(), $shift);

        return back()->with('success', 'Checked out! Verified service hours logged: '.$log->verified_hours.' hrs.');
    }
}
