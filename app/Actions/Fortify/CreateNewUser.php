<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     * Public registration ONLY supports 'volunteer' and 'organizer'.
     * Coordinators are provisioned exclusively by Organizers via /admin/coordinators.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $accountType = isset($input['account_type']) && is_string($input['account_type'])
            ? $input['account_type']
            : 'volunteer';

        $data = [
            ...$input,
            'account_type' => $accountType,
        ];

        Validator::make($data, [
            ...$this->profileRules(),
            'account_type' => ['required', 'string', Rule::in(['volunteer', 'organizer'])],
            'phone' => ['nullable', 'string', 'max:30'],
            'organization_name' => [
                Rule::requiredIf($accountType === 'organizer'),
                'nullable',
                'string',
                'max:160',
            ],
            'organization_description' => ['nullable', 'string', 'max:2000'],
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => (string) $data['name'],
            'email' => (string) $data['email'],
            'phone' => isset($data['phone']) ? (string) $data['phone'] : null,
            'organization_name' => $accountType === 'organizer'
                ? (string) $data['organization_name']
                : null,
            'organization_description' => $accountType === 'organizer' && ! empty($data['organization_description'])
                ? (string) $data['organization_description']
                : null,
            'password' => (string) $data['password'],
        ]);

        $role = Role::firstOrCreate(['name' => $accountType]);
        $user->assignRole($role);

        return $user;
    }
}
