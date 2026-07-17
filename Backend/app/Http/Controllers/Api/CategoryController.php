<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\AuditLog;
use App\Models\Category;
use App\Support\ImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::query()->withCount('events')->orderBy('name');

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return response()->json([
            'categories' => CategoryResource::collection($query->get()),
        ]);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'category' => new CategoryResource($category->loadCount('events')),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $imagePath = $request->hasFile('image')
            ? ImageStorage::store($request->file('image'), 'categories')
            : null;

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'image_path' => $imagePath,
            'is_active' => $request->boolean('is_active', true),
        ]);

        AuditLog::record($request->user(), 'category.created', $category, 'Category created.', [
            'has_image' => (bool) $imagePath,
        ]);

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => new CategoryResource($category),
        ], 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $validated = $request->validated();
        $imagePath = $category->image_path;

        if ($request->boolean('remove_image') && $imagePath) {
            ImageStorage::delete($imagePath);
            $imagePath = null;
        }

        if ($request->hasFile('image')) {
            $imagePath = ImageStorage::replace($request->file('image'), 'categories', $imagePath);
        }

        $category->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'image_path' => $imagePath,
            'is_active' => $request->boolean('is_active', true),
        ]);

        AuditLog::record($request->user(), 'category.updated', $category, 'Category updated.', [
            'has_image' => (bool) $imagePath,
        ]);

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => new CategoryResource($category->fresh()),
        ]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        ImageStorage::delete($category->image_path);

        AuditLog::record($request->user(), 'category.deleted', $category, 'Category deleted.', [
            'name' => $category->name,
        ]);

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}
