<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class EventImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'path' => $this->path,
            'url' => $this->path ? Storage::disk('public')->temporaryUrl($this->path, now()->addHours(2)) : null,
            'type' => $this->type,
            'is_cover' => (bool) $this->is_cover,
            'created_at' => $this->created_at,
        ];
    }
}
