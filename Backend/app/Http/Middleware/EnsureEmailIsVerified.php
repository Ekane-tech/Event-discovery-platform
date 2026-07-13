<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! filter_var(env('EMAIL_VERIFICATION_ENFORCED', false), FILTER_VALIDATE_BOOL)) {
            return $next($request);
        }

        $user = $request->user();

        if ($user && method_exists($user, 'hasVerifiedEmail') && ! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your email address before continuing.',
                'email_verification_required' => true,
            ], 403);
        }

        return $next($request);
    }
}
