<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') === true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(['open', 'reviewing', 'resolved', 'rejected'])],
        ];
    }
}
