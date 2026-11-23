<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignCoordinatorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('organizer') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'exists:users,email'],
            'division_id' => ['required', 'integer', 'exists:divisions,id'],
        ];
    }
}

