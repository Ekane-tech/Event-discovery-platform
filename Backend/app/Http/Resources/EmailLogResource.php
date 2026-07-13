<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmailLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'recipient' => $this->recipient,
            'subject' => $this->subject,
            'type' => $this->type,
            'status' => $this->status,
            'error_message' => $this->error_message,
            'metadata' => $this->metadata,
            'sent_at' => $this->sent_at,
            'created_at' => $this->created_at,
        ];
    }
}
