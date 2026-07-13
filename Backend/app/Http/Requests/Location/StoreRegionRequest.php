<?php

namespace App\Http\Requests\Location;

use Illuminate\Foundation\Http\FormRequest;

class StoreRegionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120', 'unique:regions,name'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
