<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignShiftVolunteerRequest;
use App\Http\Requests\StoreShiftRequest;
use App\Models\Application;
use App\Models\Division;
use App\Models\Shift;
use App\Models\User;
use App\Services\QrCodeService;
use App\Services\ShiftConflictService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request, QrCodeService $qrCodeService): Response
    {
        $user = $request->user();
        $isOrganizer = $user->hasRole('organizer');

        $divisions = Division::query()
            ->when($isOrganizer, fn ($q) => $q->whereHas('event', fn ($e) => $e->where('organizer_id', $user->id)))
            ->when(! $isOrganizer, fn ($q) => $q->where('coordinator_id', $user->id))
            ->with([
                'event:id,title,venue_name',
                'acceptedApplications.user:id,name,email',
            ])
            ->orderBy('event_id')
            ->orderBy('name')
            ->get();

        $divisionIds = $divisions->pluck('id');

        $shifts = Shift::query()
            ->whereIn('division_id', $divisionIds)
            ->with([
                'event:id,title,venue_name',
                'division:id,name',
                'volunteers:id,name,email',
                'attendanceLogs:id,shift_id,user_id,status,verified_hours',
            ])
            ->orderBy('start_time')
            ->get()
            ->map(fn (Shift $shift): array => [
                'id' => $shift->id,
                'event_id' => $shift->event_id,
                'division_id' => $shift->division_id,
                'title' => $shift->title,
                'description' => $shift->description,
                'location' => $shift->location,
                'start_time' => $shift->start_time->toIso8601String(),
                'end_time' => $shift->end_time->toIso8601String(),
                'qr_token' => $shift->qr_token,
                'qr_svg' => $qrCodeService->generateSvg($shift->qr_token, 220),
                'event_title' => $shift->event->title,
                'division_name' => $shift->division->name,
                'volunteers' => $shift->volunteers->map(fn (User $vol): array => [
                    'id' => $vol->id,
                    'name' => $vol->name,
                    'email' => $vol->email,
                ])->values()->all(),
                'checked_in_count' => $shift->attendanceLogs->count(),
            ])
            ->values()
            ->all();

        $divisionPayload = $divisions->map(fn (Division $div): array => [
            'id' => $div->id,
            'event_id' => $div->event_id,
            'name' => $div->name,
            'event_title' => $div->event->title,
            'accepted_volunteers' => $div->acceptedApplications
                ->map(fn (Application $app): array => [
                    'id' => $app->user->id,
                    'name' => $app->user->name,
                    'email' => $app->user->email,
                ])
                ->values()
                ->all(),
        ])->values()->all();

        return Inertia::render('admin/shifts/Index', [
            'shifts' => $shifts,
            'divisions' => $divisionPayload,
        ]);
    }

    public function store(StoreShiftRequest $request): RedirectResponse
    {
        $division = Division::query()->findOrFail($request->integer('division_id'));

        Shift::create([
            'event_id' => $division->event_id,
            'division_id' => $division->id,
            'title' => $request->string('title')->toString(),
            'description' => $request->input('description'),
            'start_time' => $request->input('start_time'),
            'end_time' => $request->input('end_time'),
            'location' => $request->input('location'),
        ]);

        return back()->with('success', 'Shift created with unique check-in QR code.');
    }

    public function assign(
        AssignShiftVolunteerRequest $request,
        Shift $shift,
        ShiftConflictService $conflictService,
    ): RedirectResponse {
        $volunteer = User::query()->findOrFail($request->integer('user_id'));

        $conflictService->assignVolunteer($shift, $volunteer);

        return back()->with('success', $volunteer->name.' assigned to "'.$shift->title.'".');
    }

    public function unassign(Shift $shift, User $user): RedirectResponse
    {
        Gate::authorize('manage', $shift);
        $shift->volunteers()->detach($user->id);

        return back()->with('success', $user->name.' removed from "'.$shift->title.'".');
    }

    public function destroy(Shift $shift): RedirectResponse
    {
        Gate::authorize('manage', $shift);
        $title = $shift->title;
        $shift->delete();

        return back()->with('success', 'Shift "'.$title.'" deleted.');
    }
}
