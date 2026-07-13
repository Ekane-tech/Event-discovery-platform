<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'event_id' => $this->event_id,
            'status' => $this->status,
            'ticket_number' => $this->ticket_number,
            'registered_at' => $this->registered_at,
            'checked_in_at' => $this->checked_in_at,
            'checked_in_by' => $this->checked_in_by,
            'checked_in_by_user' => new UserResource($this->whenLoaded('checkedInBy')),
            'event' => new EventResource($this->whenLoaded('event')),
            'user' => new UserResource($this->whenLoaded('user')),
            'payment' => new PaymentResource($this->whenLoaded('payment')), 
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
