<?php

namespace App\Http\Requests\Location;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDivisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') === true;
    }

    public function rules(): array
    {
        return [
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('divisions', 'name')->where(fn ($query) => $query->where('region_id', $this->input('region_id'))),
            ],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
