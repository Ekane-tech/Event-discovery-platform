<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateReportStatusRequest;
use App\Notifications\AdminAnnouncementNotification;
use App\Models\AdminAnnouncement;
use App\Http\Resources\AdminAnnouncementResource;
use App\Http\Requests\Admin\StoreAnnouncementRequest;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Resources\EventResource;
use App\Http\Resources\AppFeedbackResource;
use App\Http\Resources\ReportResource;
use App\Http\Resources\UserResource;
use App\Models\Event;
use App\Models\AppFeedback;
use App\Models\Report;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{


    public function feedbacks(Request $request): JsonResponse
    {
        $query = AppFeedback::query()->with(['user.role', 'user.profile'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('rating')) {
            $query->where('rating', $request->integer('rating'));
        }

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->where('name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('message', 'like', "%{$keyword}%");
            });
        }

        return response()->json([
            'feedbacks' => AppFeedbackResource::collection($query->paginate(min((int) $request->input('per_page', 15), 50))),
        ]);
    }

    public function updateFeedbackStatus(Request $request, AppFeedback $feedback): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:new,read,reviewing,resolved,archived'],
        ]);

        $feedback->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Feedback status updated successfully.',
            'feedback' => new AppFeedbackResource($feedback->fresh()->load(['user.role', 'user.profile'])),
        ]);
    }

    public function announcements(Request $request): JsonResponse
    {
        $query = AdminAnnouncement::query()->with('creator.role')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('audience')) {
            $query->where('audience', $request->input('audience'));
        }

        return response()->json([
            'announcements' => AdminAnnouncementResource::collection($query->paginate(min((int) $request->input('per_page', 15), 50))),
        ]);
    }

    public function storeAnnouncement(StoreAnnouncementRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $announcement = AdminAnnouncement::create([
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'audience' => $validated['audience'],
            'status' => $validated['status'] ?? 'draft',
        ]);

        if ($announcement->status === 'sent') {
            $this->sendAnnouncementToAudience($announcement);
        }

        return response()->json([
            'message' => $announcement->status === 'sent' ? 'Announcement created and sent successfully.' : 'Announcement saved as draft.',
            'announcement' => new AdminAnnouncementResource($announcement->fresh()->load('creator.role')),
        ], 201);
    }

    public function sendAnnouncement(AdminAnnouncement $announcement): JsonResponse
    {
        if ($announcement->status === 'sent') {
            return response()->json([
                'message' => 'Announcement has already been sent.',
                'announcement' => new AdminAnnouncementResource($announcement->load('creator.role')),
            ]);
        }

        $this->sendAnnouncementToAudience($announcement);

        return response()->json([
            'message' => 'Announcement sent successfully.',
            'announcement' => new AdminAnnouncementResource($announcement->fresh()->load('creator.role')),
        ]);
    }

    private function sendAnnouncementToAudience(AdminAnnouncement $announcement): void
    {
        $query = User::query()
            ->where('status', 'active')
            ->with('role')
            ->whereHas('notificationPreference', fn ($preferenceQuery) => $preferenceQuery->where('database', true)->where('admin_messages', true));

        if ($announcement->audience !== 'all') {
            $role = match ($announcement->audience) {
                'users' => 'user',
                'organizers' => 'organizer',
                'admins' => 'admin',
                default => null,
            };

            if ($role) {
                $query->whereHas('role', fn ($roleQuery) => $roleQuery->where('name', $role));
            }
        }

        $query->chunkById(100, function ($users) use ($announcement) {
            foreach ($users as $user) {
                $user->notify(new AdminAnnouncementNotification($announcement));
            }
        });

        $announcement->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::query()->with(['role', 'profile'])->latest();

        if ($request->filled('role')) {
            $query->whereHas('role', fn ($roleQuery) => $roleQuery->where('name', $request->input('role')));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->where('name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%");
            });
        }

        return response()->json([
            'users' => UserResource::collection($query->paginate(min((int) $request->input('per_page', 15), 50))),
        ]);
    }

    public function updateUserRole(UpdateUserRoleRequest $request, User $user): JsonResponse
    {
        $role = Role::where('name', $request->validated('role'))->firstOrFail();
        $user->update(['role_id' => $role->id]);

        return response()->json([
            'message' => 'User role updated successfully.',
            'user' => new UserResource($user->fresh()->load(['role', 'profile'])),
        ]);
    }

    public function updateUserStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        if ((int) $request->user()->id === (int) $user->id && $request->validated('status') === 'suspended') {
            return response()->json([
                'message' => 'You cannot suspend your own administrator account.',
            ], 422);
        }

        $user->update(['status' => $request->validated('status')]);

        if ($user->status === 'suspended') {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'User status updated successfully.',
            'user' => new UserResource($user->fresh()->load(['role', 'profile'])),
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $query = Event::query()
            ->with(['organizer.role', 'organizer.profile', 'category', 'region', 'division', 'city', 'images'])
            ->withCount(['registrations', 'bookmarks', 'reports'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->where('title', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%")
                    ->orWhere('venue', 'like', "%{$keyword}%");
            });
        }

        return response()->json([
            'events' => EventResource::collection($query->paginate(min((int) $request->input('per_page', 15), 50))),
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $query = Report::query()->with(['event.category', 'reporter.role', 'reporter.profile'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        return response()->json([
            'reports' => ReportResource::collection($query->paginate(min((int) $request->input('per_page', 15), 50))),
        ]);
    }

    public function updateReportStatus(UpdateReportStatusRequest $request, Report $report): JsonResponse
    {
        $report->update(['status' => $request->validated('status')]);

        return response()->json([
            'message' => 'Report status updated successfully.',
            'report' => new ReportResource($report->fresh()->load(['event.category', 'reporter.role', 'reporter.profile'])),
        ]);
    }
}
