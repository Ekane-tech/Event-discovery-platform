<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'city' => ['nullable', 'string', 'max:120'],
            'region' => ['nullable', 'string', 'max:120'],
            'preferred_language' => ['nullable', 'in:en,fr'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'account_type' => ['nullable', 'in:user,organizer'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }
}
