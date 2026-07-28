<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatar = $this->profile?->avatar;
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
            'organization_name' => $this->profile?->organization_name,
            'is_verified_organizer' => (bool) $this->profile?->is_verified_organizer,
            'phone' => $this->profile?->phone,
            'city' => $this->profile?->city,
            'region' => $this->profile?->region,
            'avatar' => $avatar && !str_starts_with($avatar, 'http') ? Storage::disk('public')->temporaryUrl($avatar, now()->addHours(2)) : $avatar,
            'bio' => $this->profile?->bio,
            'preferred_language' => $this->profile?->preferred_language,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
