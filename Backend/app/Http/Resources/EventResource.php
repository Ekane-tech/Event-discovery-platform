<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organizer_id' => $this->organizer_id,
            'category_id' => $this->category_id,
            'region_id' => $this->region_id,
            'division_id' => $this->division_id,
            'city_id' => $this->city_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'venue' => $this->venue,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'registration_deadline' => $this->registration_deadline,
            'price' => $this->price,
            'maximum_participants' => $this->maximum_participants,
            'status' => $this->status,
            'visibility' => $this->visibility,
            'views' => $this->views,
            'registrations_count' => $this->whenCounted('registrations'),
            'bookmarks_count' => $this->whenCounted('bookmarks'),
            'reports_count' => $this->whenCounted('reports'),
            'organizer' => new UserResource($this->whenLoaded('organizer')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'region' => new RegionResource($this->whenLoaded('region')),
            'division' => new DivisionResource($this->whenLoaded('division')),
            'city' => new CityResource($this->whenLoaded('city')),
            'images' => EventImageResource::collection($this->whenLoaded('images')),
            'ticket_types' => EventTicketTypeResource::collection($this->whenLoaded('ticketTypes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
