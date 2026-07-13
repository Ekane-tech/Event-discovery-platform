<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $roleName = $validated['account_type'] ?? 'user';
        $roleLabel = $roleName === 'organizer' ? 'Organizer' : 'Registered User';
        $userRole = Role::firstOrCreate(['name' => $roleName], ['label' => $roleLabel]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $userRole->id,
        ]);

        $user->profile()->create([
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'] ?? null,
            'region' => $validated['region'] ?? null,
            'preferred_language' => $validated['preferred_language'] ?? 'en',
            'bio' => $validated['bio'] ?? null,
            'avatar' => null,
        ]);

        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'token_type' => 'Bearer',
            'token' => $token,
            'user' => new UserResource($user->load(['role', 'profile'])),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken($validated['device_name'] ?? 'web')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully.',
            'token_type' => 'Bearer',
            'token' => $token,
            'user' => new UserResource($user->load(['role', 'profile'])),
        ]);
    }

    public function me(): JsonResponse
    {
        return response()->json([
            'user' => new UserResource(request()->user()->load(['role', 'profile'])),
        ]);
    }

    public function logout(): JsonResponse
    {
        request()->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function logoutAll(): JsonResponse
    {
        request()->user()->tokens()->delete();

        return response()->json([
            'message' => 'All sessions logged out successfully.',
        ]);
    }


    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $request->user()->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        $request->user()->tokens()->where('id', '!=', $request->user()->currentAccessToken()?->id)->delete();

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If an account exists for this email, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json([
            'message' => __($status),
        ]);
    }
}
