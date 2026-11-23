<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\AttendanceLog;
use App\Models\Event;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $applications = Application::query()
            ->where('user_id', $user->id)
            ->with([
                'event:id,title,venue_name,start_date,end_date,status',
                'event.organizer:id,name,organization_name',
                'division:id,name,coordinator_id',
                'division.coordinator:id,name',
            ])
            ->latest()
            ->get();

        $acceptedCount = $applications->where('status', Application::STATUS_ACCEPTED)->count();
        $pendingCount = $applications->whereIn('status', [
            Application::STATUS_SUBMITTED,
            Application::STATUS_UNDER_REVIEW,
        ])->count();

        $logsByShift = AttendanceLog::query()
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('shift_id');

        $completedShiftsCount = $logsByShift->where('status', AttendanceLog::STATUS_COMPLETED)->count();

        $assignedShifts = $user->shifts()
            ->with(['event:id,title,venue_name', 'division:id,name'])
            ->orderBy('start_time')
            ->get();

        $activeCheckIn = null;
        $upcomingShifts = [];

        foreach ($assignedShifts as $shift) {
            $log = $logsByShift->get($shift->id);
            $shiftPayload = [
                'id' => $shift->id,
                'title' => $shift->title,
                'location' => $shift->location,
                'start_time' => $shift->start_time->toIso8601String(),
                'end_time' => $shift->end_time->toIso8601String(),
                'division_id' => $shift->division_id,
                'division_name' => $shift->division->name,
                'event_title' => $shift->event->title,
                'venue_name' => $shift->event->venue_name,
                'attendance_status' => $log?->status,
                'checked_in_at' => $log?->checked_in_at?->toIso8601String(),
                'verified_hours' => $log?->verified_hours ?? 0,
            ];

            if ($log && $log->status === AttendanceLog::STATUS_CHECKED_IN && $activeCheckIn === null) {
                $activeCheckIn = $shiftPayload;
            } elseif (! $log || $log->status !== AttendanceLog::STATUS_COMPLETED) {
                $upcomingShifts[] = $shiftPayload;
            }
        }

        $recentApplications = $applications->take(4)->map(fn (Application $app): array => [
            'id' => $app->id,
            'status' => $app->status,
            'division_id' => $app->division_id,
            'division_name' => $app->division->name,
            'event_title' => $app->event->title,
            'organization_name' => $app->event->organizer?->organization_name ?: ($app->event->organizer?->name ?? 'Organizer'),
            'created_at' => $app->created_at?->toIso8601String(),
        ])->values()->all();

        $acceptedEventIds = $applications
            ->where('status', Application::STATUS_ACCEPTED)
            ->pluck('event_id')
            ->unique();

        $recommendedEvents = Event::query()
            ->whereIn('status', [Event::STATUS_OPEN, Event::STATUS_ONGOING])
            ->whereNotIn('id', $acceptedEventIds)
            ->with('organizer:id,name,organization_name')
            ->withCount('divisions')
            ->orderBy('start_date')
            ->limit(3)
            ->get()
            ->map(fn (Event $ev): array => [
                'id' => $ev->id,
                'title' => $ev->title,
                'venue_name' => $ev->venue_name,
                'organization_name' => $ev->organizer?->organization_name ?: ($ev->organizer?->name ?? 'Community Organizer'),
                'start_date' => $ev->start_date->toIso8601String(),
                'status' => $ev->status,
                'divisions_count' => (int) ($ev->divisions_count ?? 0),
            ])
            ->values()
            ->all();

        $acceptedWorkspaces = $applications
            ->where('status', Application::STATUS_ACCEPTED)
            ->map(fn (Application $app): array => [
                'division_id' => $app->division_id,
                'division_name' => $app->division->name,
                'event_title' => $app->event->title,
                'venue_name' => $app->event->venue_name,
                'coordinator_name' => $app->division->coordinator?->name,
            ])
            ->values()
            ->all();

        return Inertia::render('volunteer/Dashboard', [
            'summary' => [
                'verified_hours' => $user->totalVerifiedHours(),
                'completed_shifts' => $completedShiftsCount,
                'accepted_divisions' => $acceptedCount,
                'pending_applications' => $pendingCount,
                'upcoming_shifts' => count($upcomingShifts),
            ],
            'activeCheckIn' => $activeCheckIn,
            'upcomingShifts' => array_slice($upcomingShifts, 0, 4),
            'acceptedWorkspaces' => $acceptedWorkspaces,
            'recentApplications' => $recentApplications,
            'recommendedEvents' => $recommendedEvents,
        ]);
    }
}

