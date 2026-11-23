<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Application;
use App\Models\Division;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOrganizer = $user->hasRole('organizer');

        $eventsQuery = Event::query()
            ->with([
                'divisions' => fn ($q) => $q
                    ->when(! $isOrganizer, fn ($sub) => $sub->where('coordinator_id', $user->id))
                    ->with('coordinator:id,name,email')
                    ->withCount([
                        'applications as accepted_count' => fn ($a) => $a->where('status', Application::STATUS_ACCEPTED),
                        'applications as pending_count' => fn ($a) => $a->whereIn('status', [Application::STATUS_SUBMITTED, Application::STATUS_UNDER_REVIEW]),
                        'shifts as shifts_count',
                    ]),
            ])
            ->latest('start_date');

        if ($isOrganizer) {
            $eventsQuery->where('organizer_id', $user->id);
        } else {
            $eventsQuery->whereHas('divisions', fn ($q) => $q->where('coordinator_id', $user->id));
        }

        $events = $eventsQuery->get()->map(fn (Event $event): array => [
            'id' => $event->id,
            'title' => $event->title,
            'slug' => $event->slug,
            'description' => $event->description,
            'venue_name' => $event->venue_name,
            'venue_lat' => $event->venue_lat,
            'venue_lng' => $event->venue_lng,
            'checkin_radius_meters' => $event->checkin_radius_meters,
            'start_date' => $event->start_date->format('Y-m-d\TH:i'),
            'end_date' => $event->end_date->format('Y-m-d\TH:i'),
            'status' => $event->status,
            'divisions' => $event->divisions->map(fn (Division $div): array => [
                'id' => $div->id,
                'event_id' => $div->event_id,
                'name' => $div->name,
                'description' => $div->description,
                'announcements' => $div->announcements,
                'quota' => $div->quota,
                'coordinator_id' => $div->coordinator_id,
                'coordinator_name' => $div->coordinator?->name,
                'accepted_count' => (int) ($div->accepted_count ?? 0),
                'pending_count' => (int) ($div->pending_count ?? 0),
                'shifts_count' => (int) ($div->shifts_count ?? 0),
            ])->values()->all(),
        ])->values()->all();

        $coordinators = User::role(['coordinator', 'organizer'])
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get()
            ->all();

        return Inertia::render('admin/events/Index', [
            'events' => $events,
            'coordinators' => $coordinators,
            'isOrganizer' => $isOrganizer,
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $baseSlug = Str::slug($data['title']);
        $slug = $baseSlug.'-'.Str::lower(Str::random(5));

        Event::create([
            ...$data,
            'organizer_id' => $request->user()->id,
            'slug' => $slug,
        ]);

        return back()->with('success', 'Event "'.$data['title'].'" created.');
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $event->update($request->validated());

        return back()->with('success', 'Event "'.$event->title.'" updated.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        Gate::authorize('delete', $event);
        $title = $event->title;
        $event->delete();

        return back()->with('success', 'Event "'.$title.'" deleted.');
    }
}
