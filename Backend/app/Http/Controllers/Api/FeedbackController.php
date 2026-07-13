<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Feedback\StoreFeedbackRequest;
use App\Http\Resources\AppFeedbackResource;
use App\Models\AppFeedback;
use App\Models\User;
use App\Notifications\AppFeedbackSubmittedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(StoreFeedbackRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $feedback = AppFeedback::create([
            ...$validated,
            'user_id' => $user?->id,
            'name' => $validated['name'] ?? $user?->name,
            'email' => $validated['email'] ?? $user?->email,
        ]);

        $this->notifyAdmins($feedback);

        return response()->json([
            'message' => 'Thank you for your feedback.',
            'feedback' => new AppFeedbackResource($feedback),
        ], 201);

    }

    private function notifyAdmins(AppFeedback $feedback): void
    {
        User::query()
            ->where('status', 'active')
            ->whereHas('role', fn ($query) => $query->where('name', 'admin'))
            ->whereHas('notificationPreference', fn ($query) => $query->where('database', true)->where('admin_messages', true))
            ->chunkById(100, function ($admins) use ($feedback) {
                foreach ($admins as $admin) {
                    $admin->notify(new AppFeedbackSubmittedNotification($feedback));
                }
            });
    }
}