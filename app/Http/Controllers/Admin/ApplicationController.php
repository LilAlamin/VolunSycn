<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewApplicationRequest;
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
        $isOrganizer = $user->hasRole('organizer');

        $scopedDivisionIds = $isOrganizer
            ? Division::query()->whereHas('event', fn ($q) => $q->where('organizer_id', $user->id))->pluck('id')
            : Division::query()->where('coordinator_id', $user->id)->pluck('id');

        $applications = Application::query()
            ->whereIn('division_id', $scopedDivisionIds)
            ->with([
                'user:id,name,email,phone,bio',
                'event:id,title,status',
                'division:id,name,quota',
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
                'user' => [
                    'id' => $app->user->id,
                    'name' => $app->user->name,
                    'email' => $app->user->email,
                    'phone' => $app->user->phone,
                    'bio' => $app->user->bio,
                ],
                'event' => [
                    'id' => $app->event->id,
                    'title' => $app->event->title,
                ],
                'division' => [
                    'id' => $app->division->id,
                    'name' => $app->division->name,
                    'quota' => $app->division->quota,
                ],
            ])
            ->values()
            ->all();

        $events = Event::query()
            ->when($isOrganizer, fn ($q) => $q->where('organizer_id', $user->id))
            ->when(! $isOrganizer, fn ($q) => $q->whereHas('divisions', fn ($d) => $d->where('coordinator_id', $user->id)))
            ->select('id', 'title')
            ->orderBy('title')
            ->get()
            ->all();

        $divisions = Division::query()
            ->whereIn('id', $scopedDivisionIds)
            ->select('id', 'event_id', 'name')
            ->orderBy('name')
            ->get()
            ->all();

        return Inertia::render('admin/applications/Index', [
            'applications' => $applications,
            'events' => $events,
            'divisions' => $divisions,
        ]);
    }

    public function review(ReviewApplicationRequest $request, Application $application): RedirectResponse
    {
        $newStatus = $request->string('status')->toString();

        if ($newStatus === Application::STATUS_ACCEPTED && $application->status !== Application::STATUS_ACCEPTED) {
            $division = $application->division;
            $acceptedCount = $division->acceptedApplications()->count();

            if ($acceptedCount >= $division->quota) {
                throw ValidationException::withMessages([
                    'status' => 'Cannot accept: division "'.$division->name.'" has reached its quota of '.$division->quota.'.',
                ]);
            }
        }

        $application->update([
            'status' => $newStatus,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'reviewer_notes' => $request->input('reviewer_notes'),
        ]);

        return back()->with('success', 'Application status updated to '.str_replace('_', ' ', $newStatus).'.');
    }
}
