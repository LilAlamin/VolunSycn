<?php

namespace App\Http\Requests;

use App\Models\Division;
use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        if ($user->hasRole('organizer')) {
            $event = Event::find($this->integer('event_id'));

            if (! $event || $event->organizer_id !== $user->id) {
                return false;
            }

            if ($this->filled('division_id')) {
                $division = Division::find($this->integer('division_id'));

                return $division !== null && $division->event_id === $event->id;
            }

            return true;
        }

        if ($user->hasRole('coordinator')) {
            if (! $this->filled('division_id')) {
                return false;
            }

            $division = Division::find($this->integer('division_id'));

            return $division !== null && $division->coordinator_id === $user->id;
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isOrganizer = $this->user()?->hasRole('organizer') ?? false;

        return [
            'event_id' => [$isOrganizer ? 'required' : 'nullable', 'integer', 'exists:events,id'],
            'division_id' => [$isOrganizer ? 'nullable' : 'required', 'integer', 'exists:divisions,id'],
            'title' => ['required', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:5000'],
            'is_pinned' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->filled('event_id') && $this->filled('division_id')) {
                $division = Division::find($this->integer('division_id'));
                if ($division && $division->event_id !== $this->integer('event_id')) {
                    $validator->errors()->add('division_id', 'Selected division does not belong to the chosen event.');
                }
            }
        });
    }
}
