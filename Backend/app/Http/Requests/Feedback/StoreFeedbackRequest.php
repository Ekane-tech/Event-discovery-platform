<?php

namespace App\Http\Requests\Feedback;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:191'],
            'email' => ['nullable', 'email', 'max:191'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'category' => ['required', 'string', Rule::in(['general', 'bug', 'feature', 'design', 'performance'])],
            'message' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
