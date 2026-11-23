<?php

namespace App\Http\Requests;

use App\Models\Division;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDivisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Division|null $division */
        $division = $this->route('division');

        return $division !== null && ($this->user()?->can('manage', $division) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'coordinator_id' => ['nullable', 'integer', 'exists:users,id'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'announcements' => ['nullable', 'string', 'max:4000'],
            'quota' => ['required', 'integer', 'min:1', 'max:500'],
        ];
    }
}
