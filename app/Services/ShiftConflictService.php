<?php

namespace App\Services;

use App\Models\Shift;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ShiftConflictService
{
    /**
     * Find any shifts already assigned to the user that overlap with the target shift.
     * Overlap condition: existing.start_time < new.end_time AND existing.end_time > new.start_time
     *
     * @return Collection<int, Shift>
     */
    public function findConflicts(User $user, Shift $targetShift): Collection
    {
        return $user->shifts()
            ->where('shifts.id', '!=', $targetShift->id)
            ->where('shifts.start_time', '<', $targetShift->end_time)
            ->where('shifts.end_time', '>', $targetShift->start_time)
            ->with(['event:id,title', 'division:id,name'])
            ->get();
    }

    public function hasConflict(User $user, Shift $targetShift): bool
    {
        return $this->findConflicts($user, $targetShift)->isNotEmpty();
    }

    /**
     * Assign a volunteer to a shift only if there are zero overlapping shifts.
     *
     * @throws ValidationException
     */
    public function assignVolunteer(Shift $shift, User $user): void
    {
        if ($shift->volunteers()->where('users.id', $user->id)->exists()) {
            return;
        }

        $conflicts = $this->findConflicts($user, $shift);

        if ($conflicts->isNotEmpty()) {
            $first = $conflicts->first();
            $timeRange = $first->start_time->format('M d, H:i').' - '.$first->end_time->format('H:i');

            throw ValidationException::withMessages([
                'user_id' => sprintf(
                    'Schedule conflict: %s is already assigned to "%s" (%s). Double-booking is not allowed.',
                    $user->name,
                    $first->title,
                    $timeRange,
                ),
            ]);
        }

        $shift->volunteers()->attach($user->id, [
            'assigned_at' => now(),
        ]);
    }
}
