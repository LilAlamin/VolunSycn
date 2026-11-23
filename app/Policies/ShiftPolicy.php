<?php

namespace App\Policies;

use App\Models\Shift;
use App\Models\User;

class ShiftPolicy
{
    public function manage(User $user, Shift $shift): bool
    {
        if ($user->hasRole('organizer') && $shift->event?->organizer_id === $user->id) {
            return true;
        }

        return $user->hasRole('coordinator')
            && $shift->division?->coordinator_id === $user->id;
    }
}
