<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'event_id' => $this->event_id,
            'registration_id' => $this->registration_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'provider' => $this->provider,
            'operator' => $this->operator,
            'phone_number' => $this->phone_number,
            'reference' => $this->reference,
            'external_reference' => $this->external_reference,
            'provider_reference' => $this->provider_reference,
            'failure_reason' => $this->failure_reason,
            'metadata' => $this->metadata,
            'initiated_at' => $this->initiated_at,
            'paid_at' => $this->paid_at,
            'event' => new EventResource($this->whenLoaded('event')),
            'registration' => new RegistrationResource($this->whenLoaded('registration')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
