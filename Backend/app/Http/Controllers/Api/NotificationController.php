<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\UpdateNotificationPreferencesRequest;
use App\Http\Resources\NotificationPreferenceResource;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\AdminAnnouncementResource;
use App\Models\AdminAnnouncement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function publicAnnouncements(): JsonResponse
    {
        $announcements = AdminAnnouncement::query()
            ->where('status', 'sent')
            ->whereIn('audience', ['all'])
            ->latest('sent_at')
            ->limit(20)
            ->get();

        return response()->json([
            'announcements' => AdminAnnouncementResource::collection($announcements),
        ]);
    }


    public function preferences(Request $request): JsonResponse
    {
        $preferences = $request->user()->notificationPreference()->firstOrCreate([]);

        return response()->json([
            'preferences' => new NotificationPreferenceResource($preferences),
        ]);
    }

    public function updatePreferences(UpdateNotificationPreferencesRequest $request): JsonResponse
    {
        $preferences = $request->user()->notificationPreference()->updateOrCreate(
            ['user_id' => $request->user()->id],
            $request->validated()
        );

        return response()->json([
            'message' => 'Notification preferences updated successfully.',
            'preferences' => new NotificationPreferenceResource($preferences),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->notifications()->latest();

        if ($request->input('status') === 'unread') {
            $query->whereNull('read_at');
        }

        if ($request->input('status') === 'read') {
            $query->whereNotNull('read_at');
        }

        $perPage = min((int) $request->input('per_page', 15), 50);

        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'notifications' => NotificationResource::collection($query->paginate($perPage)),
        ]);
    }

    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        $notificationModel = $request->user()
            ->notifications()
            ->where('id', $notification)
            ->firstOrFail();

        $notificationModel->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read.',
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'notification' => new NotificationResource($notificationModel->fresh()),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read.',
            'unread_count' => 0,
        ]);
    }
}
