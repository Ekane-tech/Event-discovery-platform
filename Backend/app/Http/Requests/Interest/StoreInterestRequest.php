<?php

namespace App\Http\Requests\Interest;

use Illuminate\Foundation\Http\FormRequest;

class StoreInterestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120', 'unique:interests,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
