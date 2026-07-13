<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'region_id' => $this->region_id,
            'division_id' => $this->division_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'is_active' => (bool) $this->is_active,
            'region' => new RegionResource($this->whenLoaded('region')),
            'division' => new DivisionResource($this->whenLoaded('division')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
