<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Division;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventExplorerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $userApplications = $user
            ? Application::query()
                ->where('user_id', $user->id)
                ->get()
                ->keyBy('division_id')
            : collect();

        $events = Event::query()
            ->whereIn('status', [Event::STATUS_OPEN, Event::STATUS_ONGOING])
            ->with([
                'organizer:id,name,email,organization_name',
                'divisions' => fn ($query) => $query
                    ->with('coordinator:id,name,email')
                    ->withCount([
                        'applications as accepted_count' => fn ($q) => $q->where('status', Application::STATUS_ACCEPTED),
                        'applications as total_applicants_count',
                    ]),
            ])
            ->orderBy('start_date')
            ->get()
            ->map(function (Event $event) use ($userApplications): array {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'description' => $event->description,
                    'venue_name' => $event->venue_name,
                    'venue_lat' => $event->venue_lat,
                    'venue_lng' => $event->venue_lng,
                    'checkin_radius_meters' => $event->checkin_radius_meters,
                    'start_date' => $event->start_date->toIso8601String(),
                    'end_date' => $event->end_date->toIso8601String(),
                    'status' => $event->status,
                    'organizer_name' => $event->organizer?->organization_name ?: ($event->organizer?->name ?? 'Community Organizer'),
                    'divisions' => $event->divisions->map(function (Division $division) use ($userApplications): array {
                        $myApp = $userApplications->get($division->id);

                        return [
                            'id' => $division->id,
                            'name' => $division->name,
                            'description' => $division->description,
                            'quota' => $division->quota,
                            'accepted_count' => (int) ($division->accepted_count ?? 0),
                            'total_applicants_count' => (int) ($division->total_applicants_count ?? 0),
                            'coordinator_name' => $division->coordinator?->name,
                            'my_application_status' => $myApp?->status,
                            'my_application_id' => $myApp?->id,
                        ];
                    })->values()->all(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('volunteer/Events', [
            'events' => $events,
        ]);
    }
}
