<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateReportStatusRequest;
use App\Notifications\AdminAnnouncementNotification;
use App\Notifications\TestEmailNotification;
use App\Notifications\UserStatusChangedNotification;
use App\Models\AdminAnnouncement;
use App\Http\Resources\AdminAnnouncementResource;
use App\Http\Requests\Admin\StoreAnnouncementRequest;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Resources\EmailLogResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\AppFeedbackResource;
use App\Http\Resources\ReportResource;
use App\Http\Resources\UserResource;
use App\Models\EmailLog;
use App\Models\Event;
use App\Models\Payment;
use App\Models\AuditLog;
use App\Models\AppFeedback;
use App\Models\Report;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

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
        AuditLog::record($request->user(), 'feedback.status.updated', $feedback, 'Feedback status updated.', ['status' => $validated['status']]);

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
        AuditLog::record($request->user(), 'user.role.updated', $user, 'User role updated.', ['role' => $role->name]);

        return response()->json([
            'message' => 'User role updated successfully.',
            'user' => new UserResource($user->fresh()->load(['role', 'profile'])),
        ]);
    }

    public function updateUserStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json([
                'message' => 'You cannot change the status of your own administrator account.',
            ], 422);
        }

        $validated = $request->validated();
        $oldStatus = $user->status;
        $user->update(['status' => $validated['status']]);
        AuditLog::record($request->user(), 'user.status.updated', $user, 'User status updated.', [
            'old_status' => $oldStatus,
            'status' => $user->status,
            'reason' => $validated['reason'] ?? null,
        ]);

        if ($user->status === 'suspended') {
            $user->tokens()->delete();
        }

        try {
            $user->notify(new UserStatusChangedNotification($user->status, $validated['reason'] ?? null));
        } catch (\Throwable $exception) {
            AuditLog::record($request->user(), 'user.status.notification_failed', $user, 'User status notification failed.', [
                'status' => $user->status,
                'error' => $exception->getMessage(),
            ]);
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
        AuditLog::record($request->user(), 'report.status.updated', $report, 'Report status updated.', ['status' => $report->status]);

        return response()->json([
            'message' => 'Report status updated successfully.',
            'report' => new ReportResource($report->fresh()->load(['event.category', 'reporter.role', 'reporter.profile'])),
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $query = Payment::query()
            ->with(['user', 'user.role', 'user.profile', 'event.category', 'event.city', 'registration'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('provider')) {
            $query->where('provider', $request->input('provider'));
        }

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->where('reference', 'like', "%{$keyword}%")
                    ->orWhere('provider_reference', 'like', "%{$keyword}%")
                    ->orWhere('phone_number', 'like', "%{$keyword}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$keyword}%")->orWhere('email', 'like', "%{$keyword}%"))
                    ->orWhereHas('event', fn ($eventQuery) => $eventQuery->where('title', 'like', "%{$keyword}%"));
            });
        }

        return response()->json([
            'payments' => PaymentResource::collection($query->paginate(min((int) $request->input('per_page', 15), 50))),
        ]);
    }

    public function paymentSummary(): JsonResponse
    {
        $paidStatuses = ['paid', 'successful', 'success', 'completed'];

        return response()->json([
            'summary' => [
                'total_payments' => Payment::count(),
                'paid_payments' => Payment::whereIn('status', $paidStatuses)->count(),
                'pending_payments' => Payment::where('status', 'pending')->count(),
                'failed_payments' => Payment::whereIn('status', ['failed', 'cancelled'])->count(),
                'total_revenue' => (float) Payment::whereIn('status', $paidStatuses)->sum('amount'),
                'pending_revenue' => (float) Payment::where('status', 'pending')->sum('amount'),
                'revenue_by_event' => Payment::query()
                    ->select('event_id', DB::raw('SUM(amount) as revenue'), DB::raw('COUNT(*) as payments_count'))
                    ->whereIn('status', $paidStatuses)
                    ->with('event:id,title')
                    ->groupBy('event_id')
                    ->orderByDesc('revenue')
                    ->limit(8)
                    ->get(),
            ],
        ]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::query()->with(['actor.role', 'actor.profile'])->latest();

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->integer('actor_id'));
        }

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->where('action', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%")
                    ->orWhereHas('actor', fn ($actorQuery) => $actorQuery->where('name', 'like', "%{$keyword}%")->orWhere('email', 'like', "%{$keyword}%"));
            });
        }

        return response()->json([
            'audit_logs' => AuditLogResource::collection($query->paginate(min((int) $request->input('per_page', 20), 100))),
        ]);
    }


    public function emailLogs(Request $request): JsonResponse
    {
        $query = EmailLog::query()->with(['user.role', 'user.profile'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->where('recipient', 'like', "%{$keyword}%")
                    ->orWhere('subject', 'like', "%{$keyword}%")
                    ->orWhere('error_message', 'like', "%{$keyword}%");
            });
        }

        return response()->json([
            'email_logs' => EmailLogResource::collection($query->paginate(min((int) $request->input('per_page', 20), 100))),
        ]);
    }

    public function sendTestEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient' => ['required', 'email', 'max:191'],
            'subject' => ['nullable', 'string', 'max:191'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $subject = $validated['subject'] ?? 'Email delivery test';
        $message = $validated['message'] ?? 'This is a production email delivery test.';

        try {
            Notification::route('mail', $validated['recipient'])->notify(new TestEmailNotification($subject, $message));

            EmailLog::create([
                'user_id' => $request->user()->id,
                'recipient' => $validated['recipient'],
                'subject' => $subject,
                'type' => 'admin_test_email',
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => ['triggered_by' => $request->user()->email],
            ]);

            AuditLog::record($request->user(), 'email.test.sent', null, 'Admin test email sent.', [
                'recipient' => $validated['recipient'],
            ]);

            return response()->json(['message' => 'Test email sent successfully.']);
        } catch (\Throwable $exception) {
            EmailLog::create([
                'user_id' => $request->user()->id,
                'recipient' => $validated['recipient'],
                'subject' => $subject,
                'type' => 'admin_test_email',
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
                'metadata' => ['triggered_by' => $request->user()->email],
            ]);

            AuditLog::record($request->user(), 'email.test.failed', null, 'Admin test email failed.', [
                'recipient' => $validated['recipient'],
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to send test email.',
                'error' => $exception->getMessage(),
            ], 422);
        }
    }

}
