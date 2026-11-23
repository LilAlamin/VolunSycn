<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string', 'max:4000'],
            'venue_name' => ['required', 'string', 'max:180'],
            'venue_lat' => ['required', 'numeric', 'between:-90,90'],
            'venue_lng' => ['required', 'numeric', 'between:-180,180'],
            'checkin_radius_meters' => ['required', 'integer', 'min:20', 'max:5000'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['required', Rule::in(Event::STATUSES)],
        ];
    }
}
