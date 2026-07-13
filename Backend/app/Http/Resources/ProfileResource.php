<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'role' => $this->whenLoaded('role', fn () => [
                'id' => $this->role?->id,
                'name' => $this->role?->name,
                'label' => $this->role?->label,
            ]),
            'phone' => $this->profile?->phone,
            'city' => $this->profile?->city,
            'region' => $this->profile?->region,
            'avatar' => $this->profile?->avatar,
            'bio' => $this->profile?->bio,
            'preferred_language' => $this->profile?->preferred_language,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
