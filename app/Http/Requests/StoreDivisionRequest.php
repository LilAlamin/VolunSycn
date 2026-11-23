<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDivisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user || ! $user->hasRole('organizer')) {
            return false;
        }

        return \App\Models\Event::query()
            ->where('id', $this->integer('event_id'))
            ->where('organizer_id', $user->id)
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'coordinator_id' => ['nullable', 'integer', 'exists:users,id'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'announcements' => ['nullable', 'string', 'max:4000'],
            'quota' => ['required', 'integer', 'min:1', 'max:500'],
        ];
    }
}
