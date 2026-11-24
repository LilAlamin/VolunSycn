<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\Division;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOrganizer = $user->hasRole('organizer');

        if ($isOrganizer) {
            $events = Event::query()
                ->where('organizer_id', $user->id)
                ->with(['divisions:id,event_id,name'])
                ->select('id', 'title', 'status')
                ->orderBy('title')
                ->get();

            $eventIds = $events->pluck('id');

            $announcements = Announcement::query()
                ->whereIn('event_id', $eventIds)
                ->with(['event:id,title', 'division:id,name', 'author:id,name'])
                ->orderByDesc('is_pinned')
                ->latest()
                ->get();
        } else {
            $myDivisions = Division::query()
                ->where('coordinator_id', $user->id)
                ->with('event:id,title,status')
                ->orderBy('name')
                ->get();

            $myDivisionIds = $myDivisions->pluck('id');
            $myEventIds = $myDivisions->pluck('event_id')->unique()->values();

            $events = Event::query()
                ->whereIn('id', $myEventIds)
                ->with(['divisions' => fn ($q) => $q->where('coordinator_id', $user->id)->select('id', 'event_id', 'name')])
                ->select('id', 'title', 'status')
                ->orderBy('title')
                ->get();

            $announcements = Announcement::query()
                ->where(function ($q) use ($myDivisionIds, $myEventIds): void {
                    $q->whereIn('division_id', $myDivisionIds)
                        ->orWhere(function ($sub) use ($myEventIds): void {
                            $sub->whereIn('event_id', $myEventIds)
                                ->whereNull('division_id');
                        });
                })
                ->with(['event:id,title', 'division:id,name,coordinator_id', 'author:id,name'])
                ->orderByDesc('is_pinned')
                ->latest()
                ->get();
        }

        return Inertia::render('admin/announcements/Index', [
            'isOrganizer' => $isOrganizer,
            'events' => $events->map(fn (Event $event): array => [
                'id' => $event->id,
                'title' => $event->title,
                'status' => $event->status,
                'divisions' => $event->divisions->map(fn (Division $div): array => [
                    'id' => $div->id,
                    'name' => $div->name,
                ])->values()->all(),
            ])->values()->all(),
            'announcements' => $announcements->map(fn (Announcement $item): array => [
                'id' => $item->id,
                'event_id' => $item->event_id,
                'division_id' => $item->division_id,
                'title' => $item->title,
                'body' => $item->body,
                'is_pinned' => $item->is_pinned,
                'scope' => $item->division_id === null ? 'event_wide' : 'division_only',
                'event_title' => $item->event?->title ?? 'Event',
                'division_name' => $item->division?->name,
                'author_name' => $item->author?->name ?? 'Admin',
                'can_manage' => $user->can('manage', $item),
                'created_at' => $item->created_at?->toIso8601String(),
                'updated_at' => $item->updated_at?->toIso8601String(),
            ])->values()->all(),
        ]);
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $divisionId = isset($validated['division_id']) ? (int) $validated['division_id'] : null;
        $eventId = isset($validated['event_id']) ? (int) $validated['event_id'] : null;

        if ($divisionId !== null && $eventId === null) {
            $eventId = Division::query()->findOrFail($divisionId)->event_id;
        }

        Announcement::create([
            'event_id' => $eventId,
            'division_id' => $divisionId,
            'created_by' => $user->id,
            'title' => trim((string) $validated['title']),
            'body' => trim((string) $validated['body']),
            'is_pinned' => (bool) ($validated['is_pinned'] ?? false),
        ]);

        return back()->with('success', 'Announcement published.');
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        $validated = $request->validated();
        $isOrganizer = $request->user()->hasRole('organizer');

        $payload = [
            'title' => trim((string) $validated['title']),
            'body' => trim((string) $validated['body']),
            'is_pinned' => (bool) ($validated['is_pinned'] ?? $announcement->is_pinned),
        ];

        if (array_key_exists('division_id', $validated)) {
            $payload['division_id'] = $isOrganizer
                ? ($validated['division_id'] !== null ? (int) $validated['division_id'] : null)
                : (int) $validated['division_id'];
        }

        $announcement->update($payload);

        return back()->with('success', 'Announcement updated.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $announcement->loadMissing(['event:id,organizer_id', 'division:id,coordinator_id']);
        Gate::authorize('manage', $announcement);

        $announcement->delete();

        return back()->with('success', 'Announcement deleted.');
    }
}
