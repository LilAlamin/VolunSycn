<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignCoordinatorRequest;
use App\Http\Requests\StoreCoordinatorRequest;
use App\Http\Requests\UpdateCoordinatorRequest;
use App\Models\Division;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class CoordinatorController extends Controller
{
    public function index(Request $request): Response
    {
        $organizer = $request->user();

        $divisions = Division::query()
            ->whereHas('event', fn ($q) => $q->where('organizer_id', $organizer->id))
            ->with(['event:id,title', 'coordinator:id,name,email,phone'])
            ->orderBy('event_id')
            ->orderBy('name')
            ->get();

        $assignedCoordinatorIds = $divisions->pluck('coordinator_id')->filter()->unique();

        $coordinators = User::query()
            ->where(function ($q) use ($organizer, $assignedCoordinatorIds): void {
                $q->where('created_by_organizer_id', $organizer->id)
                    ->orWhereIn('id', $assignedCoordinatorIds);
            })
            ->with([
                'coordinatedDivisions' => fn ($q) => $q
                    ->whereHas('event', fn ($e) => $e->where('organizer_id', $organizer->id))
                    ->with('event:id,title'),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (User $coord): array => [
                'id' => $coord->id,
                'name' => $coord->name,
                'email' => $coord->email,
                'phone' => $coord->phone,
                'provisioned_by_me' => $coord->created_by_organizer_id === $organizer->id,
                'divisions' => $coord->coordinatedDivisions->map(fn (Division $div): array => [
                    'id' => $div->id,
                    'name' => $div->name,
                    'event_title' => $div->event->title,
                ])->values()->all(),
            ])
            ->values()
            ->all();

        $divisionOptions = $divisions->map(fn (Division $div): array => [
            'id' => $div->id,
            'name' => $div->name,
            'event_title' => $div->event->title,
            'coordinator_name' => $div->coordinator?->name,
        ])->values()->all();

        return Inertia::render('admin/coordinators/Index', [
            'coordinators' => $coordinators,
            'divisions' => $divisionOptions,
            'organizationName' => $organizer->organization_name ?? $organizer->name,
        ]);
    }

    public function store(StoreCoordinatorRequest $request): RedirectResponse
    {
        $organizer = $request->user();
        $data = $request->validated();

        $division = null;
        if (! empty($data['division_id'])) {
            $division = Division::query()
                ->whereHas('event', fn ($q) => $q->where('organizer_id', $organizer->id))
                ->find($data['division_id']);

            if (! $division) {
                throw ValidationException::withMessages([
                    'division_id' => 'You can only assign coordinators to divisions within your own events.',
                ]);
            }
        }

        $coordinator = User::create([
            'name' => $data['name'],
            'email' => strtolower(trim($data['email'])),
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
            'created_by_organizer_id' => $organizer->id,
            'email_verified_at' => now(),
        ]);

        $coordinatorRole = Role::firstOrCreate(['name' => 'coordinator']);
        $coordinator->assignRole($coordinatorRole);

        if ($division) {
            $division->update(['coordinator_id' => $coordinator->id]);
        }

        return back()->with('success', 'Coordinator account created for '.$coordinator->name.'.');
    }

    public function assign(AssignCoordinatorRequest $request): RedirectResponse
    {
        $organizer = $request->user();
        $data = $request->validated();

        $division = Division::query()
            ->whereHas('event', fn ($q) => $q->where('organizer_id', $organizer->id))
            ->find($data['division_id']);

        if (! $division) {
            throw ValidationException::withMessages([
                'division_id' => 'You can only assign coordinators to your own event divisions.',
            ]);
        }

        $user = User::query()->where('email', $data['email'])->firstOrFail();

        $coordinatorRole = Role::firstOrCreate(['name' => 'coordinator']);
        if (! $user->hasRole('coordinator')) {
            $user->assignRole($coordinatorRole);
        }

        $division->update(['coordinator_id' => $user->id]);

        return back()->with('success', $user->name.' assigned as Coordinator for '.$division->name.'.');
    }

    public function update(UpdateCoordinatorRequest $request, User $coordinator): RedirectResponse
    {
        $organizer = $request->user();
        $isProvisionedByMe = $coordinator->created_by_organizer_id === $organizer->id;

        $assignedToMyDivision = Division::query()
            ->where('coordinator_id', $coordinator->id)
            ->whereHas('event', fn ($q) => $q->where('organizer_id', $organizer->id))
            ->exists();

        if (! $isProvisionedByMe && ! $assignedToMyDivision) {
            abort(403, 'You can only manage coordinators within your own organization.');
        }

        $data = $request->validated();

        if ($isProvisionedByMe) {
            $updatePayload = [
                'name' => $data['name'],
                'email' => strtolower(trim($data['email'])),
                'phone' => $data['phone'] ?? null,
            ];

            if (! empty($data['password'])) {
                $updatePayload['password'] = $data['password'];
            }

            $coordinator->update($updatePayload);
        }

        // Sync division assignments scoped strictly to this organizer's events
        $requestedDivisionIds = collect($data['division_ids'] ?? [])->map(fn ($id) => (int) $id);
        $myDivisions = Division::query()
            ->whereHas('event', fn ($q) => $q->where('organizer_id', $organizer->id))
            ->get();

        foreach ($myDivisions as $division) {
            if ($requestedDivisionIds->contains($division->id)) {
                $division->update(['coordinator_id' => $coordinator->id]);
            } elseif ($division->coordinator_id === $coordinator->id) {
                $division->update(['coordinator_id' => null]);
            }
        }

        return back()->with('success', 'Coordinator "'.$coordinator->name.'" updated.');
    }

    public function destroy(Request $request, User $coordinator): RedirectResponse
    {
        $organizer = $request->user();
        $isProvisionedByMe = $coordinator->created_by_organizer_id === $organizer->id;

        $myDivisionsQuery = Division::query()
            ->where('coordinator_id', $coordinator->id)
            ->whereHas('event', fn ($q) => $q->where('organizer_id', $organizer->id));

        if (! $isProvisionedByMe && ! $myDivisionsQuery->exists()) {
            abort(403, 'You can only remove coordinators within your own organization.');
        }

        // Unassign from all divisions owned by this organizer
        $myDivisionsQuery->update(['coordinator_id' => null]);

        $name = $coordinator->name;

        if ($isProvisionedByMe) {
            $coordinator->delete();

            return back()->with('success', 'Provisioned coordinator "'.$name.'" deleted.');
        }

        // If no longer coordinating any division anywhere, remove coordinator role
        if (! $coordinator->coordinatedDivisions()->exists()) {
            $coordinator->removeRole('coordinator');
        }

        return back()->with('success', $name.' unassigned from your divisions.');
    }
}

