<?php

namespace App\Http\Controllers\Volunteer;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Models\Application;
use App\Models\Division;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $applications = Application::query()
            ->where('user_id', $user->id)
            ->with([
                'event:id,title,venue_name,start_date,end_date,status',
                'division:id,name,quota,coordinator_id',
                'division.coordinator:id,name,email',
                'reviewer:id,name',
            ])
            ->latest()
            ->get()
            ->map(fn (Application $app): array => [
                'id' => $app->id,
                'status' => $app->status,
                'motivation' => $app->motivation,
                'phone' => $app->phone,
                'instagram' => $app->instagram,
                'linkedin' => $app->linkedin,
                'cv_original_name' => $app->cv_original_name,
                'cv_url' => $app->cv_path ? route('applications.cv', $app) : null,
                'reviewer_notes' => $app->reviewer_notes,
                'reviewer_name' => $app->reviewer?->name,
                'reviewed_at' => $app->reviewed_at?->toIso8601String(),
                'created_at' => $app->created_at?->toIso8601String(),
                'event' => [
                    'id' => $app->event->id,
                    'title' => $app->event->title,
                    'venue_name' => $app->event->venue_name,
                    'start_date' => $app->event->start_date->toIso8601String(),
                    'status' => $app->event->status,
                ],
                'division' => [
                    'id' => $app->division->id,
                    'name' => $app->division->name,
                    'coordinator_name' => $app->division->coordinator?->name,
                ],
            ])
            ->values()
            ->all();

        return Inertia::render('volunteer/Applications', [
            'applications' => $applications,
        ]);
    }

    public function store(StoreApplicationRequest $request): RedirectResponse
    {
        $user = $request->user();
        $division = Division::query()->with('event')->findOrFail($request->integer('division_id'));

        if (! in_array($division->event->status, [Event::STATUS_OPEN, Event::STATUS_ONGOING], true)) {
            throw ValidationException::withMessages([
                'division_id' => 'Applications are closed for this event.',
            ]);
        }

        $alreadyApplied = Application::query()
            ->where('user_id', $user->id)
            ->where('event_id', $division->event_id)
            ->where('division_id', $division->id)
            ->exists();

        if ($alreadyApplied) {
            throw ValidationException::withMessages([
                'division_id' => 'You have already applied to this division.',
            ]);
        }

        $acceptedCount = $division->acceptedApplications()->count();
        if ($acceptedCount >= $division->quota) {
            throw ValidationException::withMessages([
                'division_id' => 'This division has already reached its volunteer quota.',
            ]);
        }

        $cvFile = $request->file('cv');
        $cvPath = $cvFile->store("cvs/{$user->id}", 'local');
        $phone = trim($request->string('phone')->toString());
        $instagram = $request->filled('instagram') ? trim($request->string('instagram')->toString()) : null;
        $linkedin = $request->filled('linkedin') ? trim($request->string('linkedin')->toString()) : null;

        Application::create([
            'user_id' => $user->id,
            'event_id' => $division->event_id,
            'division_id' => $division->id,
            'motivation' => $request->string('motivation')->toString(),
            'cv_path' => $cvPath,
            'cv_original_name' => $cvFile->getClientOriginalName(),
            'phone' => $phone,
            'instagram' => $instagram,
            'linkedin' => $linkedin,
            'status' => Application::STATUS_SUBMITTED,
        ]);

        if (blank($user->phone)) {
            $user->forceFill(['phone' => $phone])->save();
        }

        return redirect()
            ->route('volunteer.applications.index')
            ->with('success', 'Application submitted for '.$division->name.'!');
    }
}
