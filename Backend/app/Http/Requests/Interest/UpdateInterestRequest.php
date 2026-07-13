<?php

namespace App\Http\Requests\Interest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInterestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') === true;
    }

    public function rules(): array
    {
        $interest = $this->route('interest');

        return [
            'name' => ['required', 'string', 'max:120', Rule::unique('interests', 'name')->ignore($interest?->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
