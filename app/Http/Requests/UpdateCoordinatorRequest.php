<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateCoordinatorRequest extends FormRequest
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
        /** @var User|null $coordinator */
        $coordinator = $this->route('coordinator');

        return [
            'name' => ['required', 'string', 'max:160'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($coordinator?->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', Password::min(8)],
            'division_ids' => ['nullable', 'array'],
            'division_ids.*' => ['integer', 'exists:divisions,id'],
        ];
    }
}

