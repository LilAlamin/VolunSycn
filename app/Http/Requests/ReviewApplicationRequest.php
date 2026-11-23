<?php

namespace App\Http\Requests;

use App\Models\Application;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Application|null $application */
        $application = $this->route('application');

        return $application !== null && ($this->user()?->can('review', $application) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                Application::STATUS_UNDER_REVIEW,
                Application::STATUS_ACCEPTED,
                Application::STATUS_REJECTED,
            ])],
            'reviewer_notes' => ['nullable', 'string', 'max:1500'],
        ];
    }
}
