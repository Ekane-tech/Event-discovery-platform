<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\InterestController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Middleware\EnsureEmailIsVerified;
use Illuminate\Support\Facades\Route;

Route::get('/public/notifications', [NotificationController::class, 'publicAnnouncements'])->middleware('throttle:public-read');
Route::post('/feedback', [FeedbackController::class, 'store'])->middleware('throttle:feedback-submit');
Route::post('/payments/callback/campay', [PaymentController::class, 'campayCallback'])->middleware('throttle:payments');

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Mboa Events 237 API is running',
    ]);
});

Route::get('/categories', [CategoryController::class, 'index'])->middleware('throttle:public-read');
Route::get('/categories/{category}', [CategoryController::class, 'show'])->middleware('throttle:public-read');
Route::get('/interests', [InterestController::class, 'index'])->middleware('throttle:public-read');
Route::get('/interests/{interest}', [InterestController::class, 'show'])->middleware('throttle:public-read');

Route::get('/regions', [LocationController::class, 'regions'])->middleware('throttle:public-read');
Route::get('/regions/{region}', [LocationController::class, 'showRegion'])->middleware('throttle:public-read');
Route::get('/regions/{region}/divisions', [LocationController::class, 'regionDivisions'])->middleware('throttle:public-read');
Route::get('/regions/{region}/cities', [LocationController::class, 'regionCities'])->middleware('throttle:public-read');
Route::get('/divisions', [LocationController::class, 'divisions'])->middleware('throttle:public-read');
Route::get('/divisions/{division}', [LocationController::class, 'showDivision'])->middleware('throttle:public-read');
Route::get('/divisions/{division}/cities', [LocationController::class, 'divisionCities'])->middleware('throttle:public-read');
Route::get('/cities', [LocationController::class, 'cities'])->middleware('throttle:public-read');
Route::get('/cities/{city}', [LocationController::class, 'showCity'])->middleware('throttle:public-read');

Route::get('/events', [EventController::class, 'index'])->middleware('throttle:public-read');
Route::get('/events/{event}', [EventController::class, 'show'])->middleware('throttle:public-read');
Route::get('/tickets/verify/{ticketNumber}', [RegistrationController::class, 'verifyTicket'])->middleware('throttle:ticket-verify');

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->middleware(['signed', 'throttle:email-verification'])->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])->middleware('throttle:email-verification');
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->middleware('throttle:authenticated-read');
    Route::put('/profile', [ProfileController::class, 'update'])->middleware('throttle:event-write');
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar'])->middleware('throttle:file-upload');
    Route::delete('/profile/avatar', [ProfileController::class, 'removeAvatar'])->middleware('throttle:event-write');

    Route::get('/reports', [ReportController::class, 'index'])->middleware('role:user');
    Route::get('/reports/{report}', [ReportController::class, 'show'])->middleware('role:user');
    Route::post('/events/{event}/report', [ReportController::class, 'store'])->middleware(['role:user', EnsureEmailIsVerified::class, 'throttle:event-write']);

    Route::get('/dashboard', [DashboardController::class, 'userDashboard'])->middleware('role:user');
    Route::get('/recommendations', [RecommendationController::class, 'index'])->middleware('role:user');
    Route::get('/organizer/dashboard', [DashboardController::class, 'organizerDashboard'])->middleware('role:organizer');
    Route::get('/admin/dashboard', [DashboardController::class, 'adminDashboard'])->middleware('role:admin');

    Route::get('/notification-preferences', [NotificationController::class, 'preferences'])->middleware('throttle:authenticated-read');
    Route::put('/notification-preferences', [NotificationController::class, 'updatePreferences'])->middleware('throttle:event-write');

    Route::get('/notifications', [NotificationController::class, 'index'])->middleware('throttle:authenticated-read');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->middleware('throttle:event-write');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->middleware('throttle:event-write');

    Route::get('/bookmarks', [BookmarkController::class, 'index'])->middleware('role:user')->middleware('throttle:authenticated-read');
    Route::post('/events/{event}/bookmark', [BookmarkController::class, 'store'])->middleware(['role:user', EnsureEmailIsVerified::class, 'throttle:event-write']);
    Route::delete('/events/{event}/bookmark', [BookmarkController::class, 'destroy'])->middleware(['role:user', EnsureEmailIsVerified::class, 'throttle:event-write']);

    Route::get('/payments', [PaymentController::class, 'index'])->middleware('role:user')->middleware('throttle:authenticated-read');
    Route::get('/payments/{payment}', [PaymentController::class, 'show'])->middleware('role:user')->middleware('throttle:authenticated-read');
    Route::post('/payments/{payment}/initiate', [PaymentController::class, 'initiate'])->middleware(['role:user', EnsureEmailIsVerified::class, 'throttle:payments']);
    Route::post('/payments/{payment}/confirm', [PaymentController::class, 'confirm'])->middleware(['role:user', EnsureEmailIsVerified::class, 'throttle:payments']);
    Route::get('/payments/{payment}/status', [PaymentController::class, 'status'])->middleware('role:user')->middleware('throttle:authenticated-read');

    Route::get('/registrations', [RegistrationController::class, 'index'])->middleware('role:user')->middleware('throttle:authenticated-read');
    Route::get('/registrations/{registration}', [RegistrationController::class, 'show'])->middleware('role:user')->middleware('throttle:authenticated-read');
    Route::post('/events/{event}/register', [RegistrationController::class, 'store'])->middleware(['role:user', EnsureEmailIsVerified::class, 'throttle:event-write']);
    Route::delete('/events/{event}/registration', [RegistrationController::class, 'destroy'])->middleware(['role:user', EnsureEmailIsVerified::class, 'throttle:event-write']);

    Route::get('/organizer/events', [EventController::class, 'myEvents'])->middleware('role:organizer')->middleware('throttle:authenticated-read');
    Route::get('/organizer/events/{event}', [EventController::class, 'organizerShow'])->middleware('role:organizer,admin')->middleware('throttle:authenticated-read');
    Route::get('/organizer/events/{event}/attendees', [EventController::class, 'attendees'])->middleware('role:organizer,admin')->middleware('throttle:authenticated-read');
    Route::get('/organizer/events/{event}/attendees/export', [EventController::class, 'exportAttendees'])->middleware('role:organizer,admin')->middleware('throttle:authenticated-read');
    Route::post('/organizer/events/{event}/duplicate', [EventController::class, 'duplicate'])->middleware(['role:organizer,admin', 'throttle:event-write']);
    Route::patch('/organizer/registrations/{registration}/check-in', [RegistrationController::class, 'checkIn'])->middleware(['role:organizer,admin', 'throttle:check-in']);
    Route::post('/events', [EventController::class, 'store'])->middleware(['role:organizer,admin', EnsureEmailIsVerified::class, 'throttle:event-write']);
    Route::put('/events/{event}', [EventController::class, 'update'])->middleware(['role:organizer,admin', EnsureEmailIsVerified::class, 'throttle:event-write']);
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->middleware(['role:organizer,admin', 'throttle:event-write']);
    Route::post('/events/{event}/images', [EventController::class, 'uploadImages'])->middleware(['role:organizer,admin', EnsureEmailIsVerified::class, 'throttle:file-upload']);
    Route::delete('/events/{event}/images/{image}', [EventController::class, 'deleteImage'])->middleware(['role:organizer,admin', 'throttle:event-write']);
    Route::patch('/events/{event}/images/{image}/cover', [EventController::class, 'setCoverImage'])->middleware(['role:organizer,admin', 'throttle:event-write']);
    Route::patch('/admin/events/{event}/status', [EventController::class, 'updateStatus'])->middleware(['role:admin', 'throttle:admin-actions']);

    Route::get('/me/interests', [InterestController::class, 'myInterests'])->middleware('role:user');
    Route::post('/me/interests', [InterestController::class, 'syncMyInterests'])->middleware(['role:user', 'throttle:event-write']);

    Route::middleware('role:admin')->group(function () {

        Route::get('/admin/feedback', [AdminController::class, 'feedbacks'])->middleware('throttle:admin-actions');
        Route::patch('/admin/feedback/{feedback}/status', [AdminController::class, 'updateFeedbackStatus'])->middleware('throttle:admin-actions');

        Route::get('/admin/announcements', [AdminController::class, 'announcements'])->middleware('throttle:admin-actions');
        Route::post('/admin/announcements', [AdminController::class, 'storeAnnouncement'])->middleware('throttle:admin-actions');
        Route::patch('/admin/announcements/{announcement}/send', [AdminController::class, 'sendAnnouncement'])->middleware('throttle:admin-actions');

        Route::get('/admin/users', [AdminController::class, 'users'])->middleware('throttle:admin-actions');
        Route::patch('/admin/users/{user}/role', [AdminController::class, 'updateUserRole'])->middleware('throttle:admin-actions');
        Route::patch('/admin/users/{user}/status', [AdminController::class, 'updateUserStatus'])->middleware('throttle:admin-actions');

        Route::get('/admin/events', [AdminController::class, 'events'])->middleware('throttle:admin-actions');

        Route::get('/admin/payments', [AdminController::class, 'payments'])->middleware('throttle:admin-actions');
        Route::get('/admin/payments/summary', [AdminController::class, 'paymentSummary'])->middleware('throttle:admin-actions');
        Route::get('/admin/audit-logs', [AdminController::class, 'auditLogs'])->middleware('throttle:admin-actions');
        Route::get('/admin/email-logs', [AdminController::class, 'emailLogs'])->middleware('throttle:admin-actions');
        Route::post('/admin/test-email', [AdminController::class, 'sendTestEmail'])->middleware('throttle:admin-actions');

        Route::get('/admin/reports', [AdminController::class, 'reports'])->middleware('throttle:admin-actions');
        Route::patch('/admin/reports/{report}/status', [AdminController::class, 'updateReportStatus'])->middleware('throttle:admin-actions');
        Route::post('/categories', [CategoryController::class, 'store'])->middleware('throttle:admin-actions');
        Route::put('/categories/{category}', [CategoryController::class, 'update'])->middleware('throttle:admin-actions');
        Route::post('/categories/{category}', [CategoryController::class, 'update'])->middleware('throttle:admin-actions');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->middleware('throttle:admin-actions');

        Route::post('/interests', [InterestController::class, 'store'])->middleware('throttle:admin-actions');
        Route::put('/interests/{interest}', [InterestController::class, 'update'])->middleware('throttle:admin-actions');
        Route::delete('/interests/{interest}', [InterestController::class, 'destroy'])->middleware('throttle:admin-actions');

        Route::post('/regions', [LocationController::class, 'storeRegion'])->middleware('throttle:admin-actions');
        Route::put('/regions/{region}', [LocationController::class, 'updateRegion'])->middleware('throttle:admin-actions');
        Route::delete('/regions/{region}', [LocationController::class, 'destroyRegion'])->middleware('throttle:admin-actions');

        Route::post('/divisions', [LocationController::class, 'storeDivision'])->middleware('throttle:admin-actions');
        Route::put('/divisions/{division}', [LocationController::class, 'updateDivision'])->middleware('throttle:admin-actions');
        Route::delete('/divisions/{division}', [LocationController::class, 'destroyDivision'])->middleware('throttle:admin-actions');

        Route::post('/cities', [LocationController::class, 'storeCity'])->middleware('throttle:admin-actions');
        Route::put('/cities/{city}', [LocationController::class, 'updateCity'])->middleware('throttle:admin-actions');
        Route::delete('/cities/{city}', [LocationController::class, 'destroyCity'])->middleware('throttle:admin-actions');
    });

    // Role middleware test endpoints. You may remove these later.
    Route::get('/role-test/user', fn () => response()->json(['message' => 'User role accepted.']))->middleware('role:user')->middleware('throttle:admin-actions');
    Route::get('/role-test/organizer', fn () => response()->json(['message' => 'Organizer role accepted.']))->middleware('role:organizer')->middleware('throttle:admin-actions');
    Route::get('/role-test/admin', fn () => response()->json(['message' => 'Admin role accepted.']))->middleware('role:admin')->middleware('throttle:admin-actions');
    Route::get('/role-test/organizer-or-admin', fn () => response()->json(['message' => 'Organizer or admin role accepted.']))->middleware('role:organizer,admin')->middleware('throttle:admin-actions');
});
