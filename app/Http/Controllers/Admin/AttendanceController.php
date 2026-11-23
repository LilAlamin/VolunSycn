<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\Division;
use App\Services\AttendanceVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOrganizer = $user->hasRole('organizer');

        $divisionIds = $isOrganizer
            ? Division::query()->whereHas('event', fn ($q) => $q->where('organizer_id', $user->id))->pluck('id')
            : Division::query()->where('coordinator_id', $user->id)->pluck('id');

        $logsQuery = AttendanceLog::query()
            ->whereHas('shift', fn ($s) => $s->whereIn('division_id', $divisionIds))
            ->with([
                'user:id,name,email',
                'shift:id,title,event_id,division_id,start_time,end_time',
                'shift.event:id,title,venue_name',
                'shift.division:id,name',
            ])
            ->latest('checked_in_at');

        $logs = $logsQuery->get()->map(fn (AttendanceLog $log): array => [
            'id' => $log->id,
            'status' => $log->status,
            'checked_in_at' => $log->checked_in_at?->toIso8601String(),
            'checked_out_at' => $log->checked_out_at?->toIso8601String(),
            'checkin_lat' => $log->checkin_lat,
            'checkin_lng' => $log->checkin_lng,
            'verification_method' => $log->verification_method,
            'verified_hours' => $log->verified_hours,
            'volunteer' => [
                'id' => $log->user->id,
                'name' => $log->user->name,
                'email' => $log->user->email,
            ],
            'shift' => [
                'id' => $log->shift->id,
                'title' => $log->shift->title,
                'event_title' => $log->shift->event->title,
                'division_name' => $log->shift->division->name,
            ],
        ])->values()->all();

        $summary = [
            'total_logs' => count($logs),
            'active_checkins' => collect($logs)->where('status', AttendanceLog::STATUS_CHECKED_IN)->count(),
            'completed_shifts' => collect($logs)->where('status', AttendanceLog::STATUS_COMPLETED)->count(),
            'total_verified_hours' => round((float) collect($logs)->where('status', AttendanceLog::STATUS_COMPLETED)->sum('verified_hours'), 2),
        ];

        return Inertia::render('admin/attendance/Index', [
            'logs' => $logs,
            'summary' => $summary,
        ]);
    }

    public function forceCheckOut(
        AttendanceLog $attendanceLog,
        AttendanceVerificationService $service,
    ): RedirectResponse {
        Gate::authorize('manage', $attendanceLog->shift);

        $updated = $service->checkOut($attendanceLog->user, $attendanceLog->shift);

        return back()->with('success', 'Checked out '.$attendanceLog->user->name.' ('.$updated->verified_hours.' verified hrs).');
    }
}
