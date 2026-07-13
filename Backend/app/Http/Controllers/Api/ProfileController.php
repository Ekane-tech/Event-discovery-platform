<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'profile' => new ProfileResource($request->user()->load(['role', 'profile'])),
        ]);
    } // <-- FIX: Fermeture de la méthode show()

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $user->update(['name' => $validated['name']]);

        $profileData = [
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'] ?? null,
            'region' => $validated['region'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'preferred_language' => $validated['preferred_language'] ?? 'en',
        ];

        if (array_key_exists('avatar', $validated)) {
            $profileData['avatar'] = $validated['avatar'];
        } // <-- FIX: Fermeture de la condition IF

        $user->profile()->updateOrCreate(['user_id' => $user->id], $profileData);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'profile' => new ProfileResource($user->fresh()->load(['role', 'profile'])),
        ]);
    } // <-- FIX: Fermeture de la méthode update()

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $profile = $user->profile()->firstOrCreate(['user_id' => $user->id]);

        if ($profile->avatar && ! str_starts_with($profile->avatar, 'http')) {
            Storage::disk('public')->delete($profile->avatar);
        } // <-- FIX: Fermeture de la condition IF

        $path = $request->file('avatar')->store('avatars/'.$user->id, 'public');
        $profile->update(['avatar' => $path]);

        return response()->json([
            'message' => 'Profile photo updated successfully.',
            'profile' => new ProfileResource($user->fresh()->load(['role', 'profile'])),
        ]);
    } // <-- FIX: Fermeture de la méthode uploadAvatar()

    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile()->firstOrCreate(['user_id' => $user->id]);

        if ($profile->avatar && ! str_starts_with($profile->avatar, 'http')) {
            Storage::disk('public')->delete($profile->avatar);
        }

        $profile->update(['avatar' => null]);

        return response()->json([
            'message' => 'Profile photo removed successfully.',
            'profile' => new ProfileResource($user->fresh()->load(['role', 'profile'])),
        ]);
    } // <-- Reste une seule instance propre de removeAvatar()
}
