<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Interest\StoreInterestRequest;
use App\Http\Requests\Interest\SyncUserInterestsRequest;
use App\Http\Requests\Interest\UpdateInterestRequest;
use App\Http\Resources\InterestResource;
use App\Models\Interest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InterestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Interest::query()->withCount('users')->orderBy('name');

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return response()->json([
            'interests' => InterestResource::collection($query->get()),
        ]);
    }

    public function show(Interest $interest): JsonResponse
    {
        return response()->json([
            'interest' => new InterestResource($interest->loadCount('users')),
        ]);
    }

    public function store(StoreInterestRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $interest = Interest::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Interest created successfully.',
            'interest' => new InterestResource($interest),
        ], 201);
    }

    public function update(UpdateInterestRequest $request, Interest $interest): JsonResponse
    {
        $validated = $request->validated();

        $interest->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Interest updated successfully.',
            'interest' => new InterestResource($interest->fresh()),
        ]);
    }

    public function destroy(Interest $interest): JsonResponse
    {
        $interest->delete();

        return response()->json([
            'message' => 'Interest deleted successfully.',
        ]);
    }

    public function myInterests(Request $request): JsonResponse
    {
        $interests = $request->user()
            ->interests()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'interests' => InterestResource::collection($interests),
        ]);
    }

    public function syncMyInterests(SyncUserInterestsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $request->user()->interests()->sync($validated['interest_ids']);

        $interests = $request->user()
            ->interests()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'message' => 'Interests saved successfully.',
            'interests' => InterestResource::collection($interests),
        ]);
    }
}
