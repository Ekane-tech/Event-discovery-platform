<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'method' => $this->method,
            'destination' => $this->destination,
            'status' => $this->status,
            'reference' => $this->reference,
            'adminNotes' => $this->admin_notes,
            'processedAt' => $this->processed_at,
            'createdAt' => $this->created_at,
            'organizer' => $this->when(
                $this->relationLoaded('organizer'),
                fn () => [
                    'id' => $this->organizer?->id,
                    'name' => $this->organizer?->name,
                    'email' => $this->organizer?->email,
                ]
            ),
        ];
    }
}
