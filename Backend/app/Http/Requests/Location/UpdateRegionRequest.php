<?php

namespace App\Http\Requests\Location;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') === true;
    }

    public function rules(): array
    {
        $region = $this->route('region');

        return [
            'name' => ['required', 'string', 'max:120', Rule::unique('regions', 'name')->ignore($region?->id)],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
