<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'status' => $this->status,
            'gross' => (float) $this->gross,
            'fee' => (float) $this->fee,
            'net' => (float) $this->net,
            'description' => $this->description,
            'eventId' => $this->event_id,
            'eventTitle' => $this->whenLoaded('event', fn () => $this->event?->title),
            'paymentId' => $this->payment_id,
            'releasedAt' => $this->released_at,
            'createdAt' => $this->created_at,
        ];
    }
}
