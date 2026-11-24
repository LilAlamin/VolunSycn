<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\AttendanceLog;
use App\Models\Division;
use App\Models\Document;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $acceptedApps = Application::query()
            ->where('user_id', $user->id)
            ->where('status', Application::STATUS_ACCEPTED)
            ->with([
                'event.organizer:id,name,organization_name',
                'division' => fn ($q) => $q
                    ->with('coordinator:id,name,email')
                    ->withCount([
                        'applications as members_count' => fn ($a) => $a->where('status', Application::STATUS_ACCEPTED),
                    ]),
            ])
            ->latest('reviewed_at')
            ->get();

        $myShiftCountsByDivision = $user->shifts()
            ->select('shifts.division_id')
            ->get()
            ->groupBy('division_id')
            ->map->count();

        $workspaces = $acceptedApps->map(function (Application $app) use ($acceptedApps, $myShiftCountsByDivision): array {
            $event = $app->event;
            $division = $app->division;

            // Detect if another accepted event overlaps in date range
            $overlappingTitles = $acceptedApps
                ->filter(function (Application $other) use ($app, $event): bool {
                    if ($other->id === $app->id || $other->event_id === $app->event_id) {
                        return false;
                    }

                    return $other->event->start_date->lt($event->end_date)
                        && $other->event->end_date->gt($event->start_date);
                })
                ->map(fn (Application $other): string => $other->event->title)
                ->unique()
                ->values()
                ->all();

            return [
                'division_id' => $division->id,
                'division_name' => $division->name,
                'division_description' => $division->description,
                'coordinator_name' => $division->coordinator?->name,
                'members_count' => (int) ($division->members_count ?? 0),
                'my_shifts_count' => (int) ($myShiftCountsByDivision->get($division->id, 0)),
                'event' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'venue_name' => $event->venue_name,
                    'organization_name' => $event->organizer?->organization_name ?: ($event->organizer?->name ?? 'Community Organizer'),
                    'start_date' => $event->start_date->toIso8601String(),
                    'end_date' => $event->end_date->toIso8601String(),
                    'status' => $event->status,
                ],
                'overlapping_event_titles' => $overlappingTitles,
            ];
        })->values()->all();

        return Inertia::render('volunteer/Workspaces', [
            'workspaces' => $workspaces,
        ]);
    }

    public function show(Request $request, Division $division): Response
    {
        Gate::authorize('accessWorkspace', $division);

        $user = $request->user();
        $division->load(['event.organizer:id,name,organization_name', 'coordinator:id,name,email,phone,bio']);

        $members = Application::query()
            ->where('division_id', $division->id)
            ->where('status', Application::STATUS_ACCEPTED)
            ->with('user:id,name,email,phone,bio')
            ->get()
            ->map(fn (Application $app): array => [
                'id' => $app->user->id,
                'name' => $app->user->name,
                'email' => $app->user->email,
                'phone' => $app->phone ?: $app->user->phone,
                'bio' => $app->user->bio,
                'is_me' => $app->user->id === $user->id,
            ])
            ->values()
            ->all();

        $myAttendance = AttendanceLog::query()
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('shift_id');

        $shifts = Shift::query()
            ->where('division_id', $division->id)
            ->with('volunteers:id,name')
            ->orderBy('start_time')
            ->get()
            ->map(function (Shift $shift) use ($user, $myAttendance): array {
                $log = $myAttendance->get($shift->id);
                $isAssigned = $shift->volunteers->contains('id', $user->id);

                return [
                    'id' => $shift->id,
                    'title' => $shift->title,
                    'description' => $shift->description,
                    'location' => $shift->location,
                    'start_time' => $shift->start_time->toIso8601String(),
                    'end_time' => $shift->end_time->toIso8601String(),
                    'is_assigned_to_me' => $isAssigned,
                    'qr_token' => $isAssigned ? $shift->qr_token : null,
                    'volunteers' => $shift->volunteers->map(fn ($v): array => [
                        'id' => $v->id,
                        'name' => $v->name,
                    ])->values()->all(),
                    'my_attendance' => $log ? [
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

        $divisionShiftIds = collect($shifts)->pluck('id');
        $divisionVerifiedHours = round(
            (float) AttendanceLog::query()
                ->where('user_id', $user->id)
                ->whereIn('shift_id', $divisionShiftIds)
                ->where('status', AttendanceLog::STATUS_COMPLETED)
                ->sum('verified_hours'),
            2,
        );

        $documents = Document::query()
            ->where('event_id', $division->event_id)
            ->where(function ($q) use ($division): void {
                $q->where('visibility', Document::VISIBILITY_EVENT_ALL)
                    ->orWhere(function ($sub) use ($division): void {
                        $sub->where('visibility', Document::VISIBILITY_DIVISION_ONLY)
                            ->where('division_id', $division->id);
                    });
            })
            ->with('uploader:id,name')
            ->latest()
            ->get()
            ->map(fn (Document $doc): array => [
                'id' => $doc->id,
                'title' => $doc->title,
                'mime_type' => $doc->mime_type,
                'file_size' => $doc->file_size,
                'visibility' => $doc->visibility,
                'uploader_name' => $doc->uploader?->name ?? 'Organizer',
                'created_at' => $doc->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return Inertia::render('volunteer/Workspace', [
            'division' => [
                'id' => $division->id,
                'name' => $division->name,
                'description' => $division->description,
                'announcements' => $division->announcements,
                'quota' => $division->quota,
                'event' => [
                    'id' => $division->event->id,
                    'title' => $division->event->title,
                    'venue_name' => $division->event->venue_name,
                    'venue_lat' => $division->event->venue_lat,
                    'venue_lng' => $division->event->venue_lng,
                    'checkin_radius_meters' => $division->event->checkin_radius_meters,
                    'organization_name' => $division->event->organizer?->organization_name ?: ($division->event->organizer?->name ?? 'Community Organizer'),
                    'start_date' => $division->event->start_date->toIso8601String(),
                    'end_date' => $division->event->end_date->toIso8601String(),
                    'status' => $division->event->status,
                ],
                'coordinator' => $division->coordinator ? [
                    'id' => $division->coordinator->id,
                    'name' => $division->coordinator->name,
                    'email' => $division->coordinator->email,
                    'phone' => $division->coordinator->phone,
                    'bio' => $division->coordinator->bio,
                ] : null,
            ],
            'members' => $members,
            'shifts' => $shifts,
            'divisionVerifiedHours' => $divisionVerifiedHours,
            'documents' => $documents,
        ]);
    }
}
