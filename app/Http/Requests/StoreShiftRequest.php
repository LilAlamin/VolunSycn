<?php

namespace App\Http\Requests;

use App\Models\Division;
use Illuminate\Foundation\Http\FormRequest;

class StoreShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $division = Division::query()->with('event')->find($this->input('division_id'));
        if (! $division) {
            return false;
        }

        if ($user->hasRole('organizer')) {
            return $division->event->organizer_id === $user->id;
        }

        if ($user->hasRole('coordinator')) {
            return $division->coordinator_id === $user->id;
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'division_id' => ['required', 'integer', 'exists:divisions,id'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'location' => ['nullable', 'string', 'max:180'],
        ];
    }
}
