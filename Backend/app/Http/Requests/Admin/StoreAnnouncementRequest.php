<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') === true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:191'],
            'message' => ['required', 'string', 'max:5000'],
            'audience' => ['required', 'string', Rule::in(['users', 'organizers', 'admins', 'all'])],
            'status' => ['nullable', 'string', Rule::in(['draft', 'sent'])],
        ];
    }
}
