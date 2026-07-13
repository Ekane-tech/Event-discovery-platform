<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Location\StoreCityRequest;
use App\Http\Requests\Location\StoreDivisionRequest;
use App\Http\Requests\Location\StoreRegionRequest;
use App\Http\Requests\Location\UpdateCityRequest;
use App\Http\Requests\Location\UpdateDivisionRequest;
use App\Http\Requests\Location\UpdateRegionRequest;
use App\Http\Resources\CityResource;
use App\Http\Resources\DivisionResource;
use App\Http\Resources\RegionResource;
use App\Models\City;
use App\Models\Division;
use App\Models\Region;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LocationController extends Controller
{
    public function regions(Request $request): JsonResponse
    {
        $query = Region::query()->withCount(['divisions', 'cities'])->orderBy('name');

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return response()->json([
            'regions' => RegionResource::collection($query->get()),
        ]);
    }

    public function showRegion(Region $region): JsonResponse
    {
        return response()->json([
            'region' => new RegionResource($region->load(['divisions', 'cities'])->loadCount(['divisions', 'cities'])),
        ]);
    }

    public function divisions(Request $request): JsonResponse
    {
        $query = Division::query()->with(['region'])->withCount('cities')->orderBy('name');

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->integer('region_id'));
        }

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return response()->json([
            'divisions' => DivisionResource::collection($query->get()),
        ]);
    }

    public function showDivision(Division $division): JsonResponse
    {
        return response()->json([
            'division' => new DivisionResource($division->load(['region', 'cities'])->loadCount('cities')),
        ]);
    }

    public function cities(Request $request): JsonResponse
    {
        $query = City::query()->with(['region', 'division'])->orderBy('name');

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->integer('region_id'));
        }

        if ($request->filled('division_id')) {
            $query->where('division_id', $request->integer('division_id'));
        }

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return response()->json([
            'cities' => CityResource::collection($query->get()),
        ]);
    }

    public function showCity(City $city): JsonResponse
    {
        return response()->json([
            'city' => new CityResource($city->load(['region', 'division'])),
        ]);
    }

    public function regionDivisions(Region $region): JsonResponse
    {
        return response()->json([
            'region' => new RegionResource($region),
            'divisions' => DivisionResource::collection($region->divisions()->where('is_active', true)->orderBy('name')->get()),
        ]);
    }

    public function regionCities(Region $region): JsonResponse
    {
        return response()->json([
            'region' => new RegionResource($region),
            'cities' => CityResource::collection($region->cities()->with('division')->where('is_active', true)->orderBy('name')->get()),
        ]);
    }

    public function divisionCities(Division $division): JsonResponse
    {
        return response()->json([
            'division' => new DivisionResource($division->load('region')),
            'cities' => CityResource::collection($division->cities()->where('is_active', true)->orderBy('name')->get()),
        ]);
    }

    public function storeRegion(StoreRegionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $region = Region::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Region created successfully.',
            'region' => new RegionResource($region),
        ], 201);
    }

    public function updateRegion(UpdateRegionRequest $request, Region $region): JsonResponse
    {
        $validated = $request->validated();

        $region->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Region updated successfully.',
            'region' => new RegionResource($region->fresh()),
        ]);
    }

    public function destroyRegion(Region $region): JsonResponse
    {
        $region->delete();

        return response()->json([
            'message' => 'Region deleted successfully.',
        ]);
    }

    public function storeDivision(StoreDivisionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $division = Division::create([
            'region_id' => $validated['region_id'],
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Division created successfully.',
            'division' => new DivisionResource($division->load('region')),
        ], 201);
    }

    public function updateDivision(UpdateDivisionRequest $request, Division $division): JsonResponse
    {
        $validated = $request->validated();

        $division->update([
            'region_id' => $validated['region_id'],
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Division updated successfully.',
            'division' => new DivisionResource($division->fresh()->load('region')),
        ]);
    }

    public function destroyDivision(Division $division): JsonResponse
    {
        $division->delete();

        return response()->json([
            'message' => 'Division deleted successfully.',
        ]);
    }

    public function storeCity(StoreCityRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $city = City::create([
            'region_id' => $validated['region_id'],
            'division_id' => $validated['division_id'] ?? null,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'City created successfully.',
            'city' => new CityResource($city->load(['region', 'division'])),
        ], 201);
    }

    public function updateCity(UpdateCityRequest $request, City $city): JsonResponse
    {
        $validated = $request->validated();

        $city->update([
            'region_id' => $validated['region_id'],
            'division_id' => $validated['division_id'] ?? null,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'City updated successfully.',
            'city' => new CityResource($city->fresh()->load(['region', 'division'])),
        ]);
    }

    public function destroyCity(City $city): JsonResponse
    {
        $city->delete();

        return response()->json([
            'message' => 'City deleted successfully.',
        ]);
    }
}