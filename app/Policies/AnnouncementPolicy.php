<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;

class AnnouncementPolicy
{
    public function manage(User $user, Announcement $announcement): bool
    {
        if ($user->hasRole('organizer') && $announcement->event?->organizer_id === $user->id) {
            return true;
        }

        return $user->hasRole('coordinator')
            && $announcement->division_id !== null
            && $announcement->division?->coordinator_id === $user->id;
    }
}
