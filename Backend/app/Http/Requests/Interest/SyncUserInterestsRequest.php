<?php

namespace App\Http\Requests\Interest;

use Illuminate\Foundation\Http\FormRequest;

class SyncUserInterestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('user') === true;
    }

    public function rules(): array
    {
        return [
            'interest_ids' => ['required', 'array'],
            'interest_ids.*' => ['integer', 'exists:interests,id'],
        ];
    }
}
