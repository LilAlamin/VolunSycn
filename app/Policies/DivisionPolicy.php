<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\Division;
use App\Models\User;

class DivisionPolicy
{
    public function manage(User $user, Division $division): bool
    {
        if ($user->hasRole('organizer') && $division->event?->organizer_id === $user->id) {
            return true;
        }

        return $user->hasRole('coordinator') && $division->coordinator_id === $user->id;
    }

    public function accessWorkspace(User $user, Division $division): bool
    {
        if ($this->manage($user, $division)) {
            return true;
        }

        return Application::query()
            ->where('user_id', $user->id)
            ->where('division_id', $division->id)
            ->where('status', Application::STATUS_ACCEPTED)
            ->exists();
    }
}
