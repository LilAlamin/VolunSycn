<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    public function review(User $user, Application $application): bool
    {
        if ($user->hasRole('organizer') && $application->event?->organizer_id === $user->id) {
            return true;
        }

        return $user->hasRole('coordinator')
            && $application->division?->coordinator_id === $user->id;
    }

    public function viewCv(User $user, Application $application): bool
    {
        if ($application->user_id === $user->id) {
            return true;
        }

        return $this->review($user, $application);
    }
}
