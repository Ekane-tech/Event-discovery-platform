<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('user') === true;
    }

    public function rules(): array
    {
        return [
            'type' => [
                'required',
                'string',
                Rule::in([
                    'fake_event',
                    'wrong_information',
                    'wrong_location',
                    'inappropriate_content',
                    'duplicate_event',
                    'scam_or_fraud',
                    'other',
                ]),
            ],
            'message' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
