<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $userRole = $user->role?->name;

        if (! $userRole || ! in_array($userRole, $roles, true)) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to access this resource.',
                'required_roles' => $roles,
                'current_role' => $userRole,
            ], 403);
        }

        return $next($request);
    }
}