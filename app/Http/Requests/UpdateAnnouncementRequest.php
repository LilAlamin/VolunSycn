<?php

namespace App\Http\Requests;

use App\Models\Announcement;
use App\Models\Division;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        /** @var Announcement|null $announcement */
        $announcement = $this->route('announcement');

        if (! $user || ! $announcement) {
            return false;
        }

        if (! $user->can('manage', $announcement)) {
            return false;
        }

        if ($user->hasRole('coordinator') && $this->filled('division_id')) {
            $division = Division::find($this->integer('division_id'));

            return $division !== null
                && $division->coordinator_id === $user->id
                && $division->event_id === $announcement->event_id;
        }

        if ($user->hasRole('organizer') && $this->filled('division_id')) {
            $division = Division::find($this->integer('division_id'));

            return $division !== null && $division->event_id === $announcement->event_id;
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isOrganizer = $this->user()?->hasRole('organizer') ?? false;

        return [
            'division_id' => [$isOrganizer ? 'nullable' : 'sometimes', 'integer', 'exists:divisions,id'],
            'title' => ['required', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:5000'],
            'is_pinned' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Announcement|null $announcement */
            $announcement = $this->route('announcement');
            if ($announcement && $this->filled('division_id')) {
                $division = Division::find($this->integer('division_id'));
                if ($division && $division->event_id !== $announcement->event_id) {
                    $validator->errors()->add('division_id', 'Selected division does not belong to this event.');
                }
            }
        });
    }
}
