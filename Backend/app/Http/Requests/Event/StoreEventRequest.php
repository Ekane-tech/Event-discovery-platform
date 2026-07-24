<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('organizer') === true || $this->user()?->hasRole('admin') === true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:191'],
            'description' => ['required', 'string', 'max:10000'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'division_id' => ['nullable', 'integer', 'exists:divisions,id'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'venue' => ['nullable', 'string', 'max:191'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'registration_deadline' => ['nullable', 'date', 'before_or_equal:start_date'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'maximum_participants' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', Rule::in(['draft', 'pending', 'published'])],
            'visibility' => ['nullable', Rule::in(['public', 'private'])],
            'images' => ['nullable', 'array'],
            'images.*.path' => ['required_with:images', 'string', 'max:2048'],
            'images.*.type' => ['nullable', 'string', 'max:50'],
            'images.*.is_cover' => ['nullable', 'boolean'],
            'ticket_types' => ['nullable', 'array', 'max:6'],
            'ticket_types.*.id' => ['nullable', 'integer', 'exists:event_ticket_types,id'],
            'ticket_types.*.name' => ['required_with:ticket_types', 'string', 'max:80'],
            'ticket_types.*.description' => ['nullable', 'string', 'max:500'],
            'ticket_types.*.price' => ['required_with:ticket_types', 'numeric', 'min:0'],
            'ticket_types.*.quantity' => ['nullable', 'integer', 'min:1'],
            'ticket_types.*.is_active' => ['nullable', 'boolean'],
        ];
    }
}
