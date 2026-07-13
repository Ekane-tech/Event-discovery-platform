<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status ?? 'active',
            'email_verified_at' => $this->email_verified_at,
            'role' => $this->whenLoaded('role', fn () => [
                'id' => $this->role?->id,
                'name' => $this->role?->name,
                'label' => $this->role?->label,
            ]),
            'profile' => $this->whenLoaded('profile', fn () => [
                'organization_name' => $this->profile?->organization_name,
                'phone' => $this->profile?->phone,
                'city' => $this->profile?->city,
                'region' => $this->profile?->region,
                'avatar' => $this->profile?->avatar,
                'bio' => $this->profile?->bio,
                'preferred_language' => $this->profile?->preferred_language,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
