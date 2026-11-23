<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\AttendanceLog;
use App\Models\Division;
use App\Models\Event;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOrganizer = $user->hasRole('organizer');

        $divisionIds = $isOrganizer
            ? Division::query()->whereHas('event', fn ($q) => $q->where('organizer_id', $user->id))->pluck('id')
            : Division::query()->where('coordinator_id', $user->id)->pluck('id');

        $applicationsQuery = Application::query()->whereIn('division_id', $divisionIds);
        $shiftsQuery = Shift::query()->whereIn('division_id', $divisionIds);
        $divisionsQuery = Division::query()->whereIn('id', $divisionIds);
        $attendanceQuery = AttendanceLog::query()->whereHas('shift', fn ($q) => $q->whereIn('division_id', $divisionIds));

        $totalQuota = (int) (clone $divisionsQuery)->sum('quota');
        $totalAccepted = (int) (clone $applicationsQuery)->where('status', Application::STATUS_ACCEPTED)->count();

        $kpis = [
            'total_events' => $isOrganizer
                ? Event::query()->where('organizer_id', $user->id)->count()
                : Event::query()->whereHas('divisions', fn ($q) => $q->where('coordinator_id', $user->id))->count(),
            'total_volunteers' => User::role('volunteer')->count(),
            'pending_applications' => (clone $applicationsQuery)
                ->whereIn('status', [Application::STATUS_SUBMITTED, Application::STATUS_UNDER_REVIEW])
                ->count(),
            'accepted_volunteers' => $totalAccepted,
            'total_shifts' => (clone $shiftsQuery)->count(),
            'verified_hours' => round((float) (clone $attendanceQuery)->where('status', AttendanceLog::STATUS_COMPLETED)->sum('verified_hours'), 1),
            'active_checkins' => (clone $attendanceQuery)->where('status', AttendanceLog::STATUS_CHECKED_IN)->count(),
            'fill_rate' => $totalQuota > 0 ? round(($totalAccepted / $totalQuota) * 100, 1) : 0,
        ];

        $recentApplications = (clone $applicationsQuery)
            ->with(['user:id,name,email', 'event:id,title', 'division:id,name'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Application $app): array => [
                'id' => $app->id,
                'volunteer_name' => $app->user->name,
                'volunteer_email' => $app->user->email,
                'event_title' => $app->event->title,
                'division_name' => $app->division->name,
                'status' => $app->status,
                'created_at' => $app->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return Inertia::render('admin/Dashboard', [
            'kpis' => $kpis,
            'recentApplications' => $recentApplications,
            'isOrganizer' => $isOrganizer,
        ]);
    }
}
