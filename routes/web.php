<?php

use App\Http\Controllers\Admin\AnnouncementController as AdminAnnouncementController;
use App\Http\Controllers\Admin\ApplicationController as AdminApplicationController;
use App\Http\Controllers\Admin\AttendanceController as AdminAttendanceController;
use App\Http\Controllers\Admin\CoordinatorController as AdminCoordinatorController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DivisionController as AdminDivisionController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\ShiftController as AdminShiftController;
use App\Http\Controllers\ApplicationCvController;
use App\Http\Controllers\Volunteer\ApplicationController as VolunteerApplicationController;
use App\Http\Controllers\Volunteer\CheckInController as VolunteerCheckInController;
use App\Http\Controllers\Volunteer\DashboardController as VolunteerDashboardController;
use App\Http\Controllers\Volunteer\EventExplorerController;
use App\Http\Controllers\Volunteer\WorkspaceController;
use App\Models\AttendanceLog;
use App\Models\Division;
use App\Models\Event;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $featuredEvents = Event::query()
        ->whereIn('status', [Event::STATUS_OPEN, Event::STATUS_ONGOING])
        ->withCount(['divisions', 'shifts'])
        ->orderBy('start_date')
        ->limit(3)
        ->get()
        ->map(fn (Event $event): array => [
            'id' => $event->id,
            'title' => $event->title,
            'venue_name' => $event->venue_name,
            'start_date' => $event->start_date->toIso8601String(),
            'status' => $event->status,
            'divisions_count' => (int) ($event->divisions_count ?? 0),
            'shifts_count' => (int) ($event->shifts_count ?? 0),
        ])
        ->values()
        ->all();

    return Inertia::render('welcome', [
        'stats' => [
            'volunteers' => User::query()->whereHas('roles', fn ($q) => $q->where('name', 'volunteer'))->count(),
            'events' => Event::query()->count(),
            'divisions' => Division::query()->count(),
            'shifts' => Shift::query()->count(),
            'verified_hours' => round((float) AttendanceLog::query()->where('status', AttendanceLog::STATUS_COMPLETED)->sum('verified_hours'), 1),
        ],
        'featuredEvents' => $featuredEvents,
    ]);
})->name('home');

// Public & Authenticated Event Explorer
Route::get('/events', [EventExplorerController::class, 'index'])->name('events.index');

// Smart Role-Based Dashboard Redirect
Route::middleware(['auth'])->get('/dashboard', function (Request $request) {
    if ($request->user()->hasAnyRole(['organizer', 'coordinator'])) {
        return redirect()->route('admin.dashboard');
    }

    return redirect()->route('volunteer.dashboard');
})->name('dashboard');

// Private Application CV Access (authorized via ApplicationPolicy::viewCv)
Route::middleware(['auth'])
    ->get('/applications/{application}/cv', ApplicationCvController::class)
    ->name('applications.cv');

// Volunteer Routes
Route::middleware(['auth'])->prefix('volunteer')->name('volunteer.')->group(function () {
    Route::get('/dashboard', [VolunteerDashboardController::class, 'index'])->name('dashboard');
    Route::get('/applications', [VolunteerApplicationController::class, 'index'])->name('applications.index');
    Route::post('/applications', [VolunteerApplicationController::class, 'store'])->name('applications.store');

    Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('workspaces.index');
    Route::get('/workspace/{division}', [WorkspaceController::class, 'show'])->name('workspace.show');

    Route::get('/check-in', [VolunteerCheckInController::class, 'index'])->name('checkin.index');
    Route::post('/check-in', [VolunteerCheckInController::class, 'checkIn'])->name('checkin.store');
    Route::post('/check-out/{shift}', [VolunteerCheckInController::class, 'checkOut'])->name('checkout.store');
});

// Organizer & Coordinator Admin Routes
Route::middleware(['auth', 'role:organizer|coordinator'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        Route::get('/events', [AdminEventController::class, 'index'])->name('events.index');
        Route::post('/events', [AdminEventController::class, 'store'])->name('events.store');
        Route::put('/events/{event}', [AdminEventController::class, 'update'])->name('events.update');
        Route::delete('/events/{event}', [AdminEventController::class, 'destroy'])->name('events.destroy');

        Route::post('/divisions', [AdminDivisionController::class, 'store'])->name('divisions.store');
        Route::put('/divisions/{division}', [AdminDivisionController::class, 'update'])->name('divisions.update');
        Route::delete('/divisions/{division}', [AdminDivisionController::class, 'destroy'])->name('divisions.destroy');

        Route::get('/announcements', [AdminAnnouncementController::class, 'index'])->name('announcements.index');
        Route::post('/announcements', [AdminAnnouncementController::class, 'store'])->name('announcements.store');
        Route::put('/announcements/{announcement}', [AdminAnnouncementController::class, 'update'])->name('announcements.update');
        Route::delete('/announcements/{announcement}', [AdminAnnouncementController::class, 'destroy'])->name('announcements.destroy');

        Route::get('/applications', [AdminApplicationController::class, 'index'])->name('applications.index');
        Route::patch('/applications/{application}/review', [AdminApplicationController::class, 'review'])->name('applications.review');

        Route::get('/shifts', [AdminShiftController::class, 'index'])->name('shifts.index');
        Route::post('/shifts', [AdminShiftController::class, 'store'])->name('shifts.store');
        Route::post('/shifts/{shift}/assign', [AdminShiftController::class, 'assign'])->name('shifts.assign');
        Route::delete('/shifts/{shift}/volunteers/{user}', [AdminShiftController::class, 'unassign'])->name('shifts.unassign');
        Route::delete('/shifts/{shift}', [AdminShiftController::class, 'destroy'])->name('shifts.destroy');

        Route::get('/attendance', [AdminAttendanceController::class, 'index'])->name('attendance.index');
        Route::post('/attendance/{attendanceLog}/checkout', [AdminAttendanceController::class, 'forceCheckOut'])->name('attendance.checkout');
    });

// Organizer-Only Coordinator Provisioning Routes
Route::middleware(['auth', 'role:organizer'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/coordinators', [AdminCoordinatorController::class, 'index'])->name('coordinators.index');
        Route::post('/coordinators', [AdminCoordinatorController::class, 'store'])->name('coordinators.store');
        Route::post('/coordinators/assign', [AdminCoordinatorController::class, 'assign'])->name('coordinators.assign');
        Route::put('/coordinators/{coordinator}', [AdminCoordinatorController::class, 'update'])->name('coordinators.update');
        Route::delete('/coordinators/{coordinator}', [AdminCoordinatorController::class, 'destroy'])->name('coordinators.destroy');
    });

require __DIR__.'/settings.php';
