<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecommendationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $event = $this->resource['event'];

        return [
            ...((new EventResource($event))->toArray($request)),
            'recommendation_score' => $this->resource['score'],
            'recommendation_reasons' => $this->resource['reasons'],
        ];
    }
}
