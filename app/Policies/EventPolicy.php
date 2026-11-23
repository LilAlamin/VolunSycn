<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['organizer', 'coordinator']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('organizer');
    }

    public function update(User $user, Event $event): bool
    {
        return $user->hasRole('organizer') && $event->organizer_id === $user->id;
    }

    public function delete(User $user, Event $event): bool
    {
        return $user->hasRole('organizer') && $event->organizer_id === $user->id;
    }
}
