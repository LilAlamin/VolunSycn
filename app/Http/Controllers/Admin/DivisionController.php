<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDivisionRequest;
use App\Http\Requests\UpdateDivisionRequest;
use App\Models\Division;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class DivisionController extends Controller
{
    public function store(StoreDivisionRequest $request): RedirectResponse
    {
        $division = Division::create($request->validated());

        return back()->with('success', 'Division "'.$division->name.'" created.');
    }

    public function update(UpdateDivisionRequest $request, Division $division): RedirectResponse
    {
        $division->update($request->validated());

        return back()->with('success', 'Division "'.$division->name.'" updated.');
    }

    public function destroy(Division $division): RedirectResponse
    {
        Gate::authorize('manage', $division);
        $name = $division->name;
        $division->delete();

        return back()->with('success', 'Division "'.$name.'" deleted.');
    }
}
