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
use Illuminate\Support\Facades\Route;

Route::get('/public/notifications', [NotificationController::class, 'publicAnnouncements']);
Route::post('/feedback', [FeedbackController::class, 'store']);
Route::post('/payments/callback/campay', [PaymentController::class, 'campayCallback']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Event Discovery Platform API is running',
    ]);
});

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);
Route::get('/interests', [InterestController::class, 'index']);
Route::get('/interests/{interest}', [InterestController::class, 'show']);

Route::get('/regions', [LocationController::class, 'regions']);
Route::get('/regions/{region}', [LocationController::class, 'showRegion']);
Route::get('/regions/{region}/divisions', [LocationController::class, 'regionDivisions']);
Route::get('/regions/{region}/cities', [LocationController::class, 'regionCities']);
Route::get('/divisions', [LocationController::class, 'divisions']);
Route::get('/divisions/{division}', [LocationController::class, 'showDivision']);
Route::get('/divisions/{division}/cities', [LocationController::class, 'divisionCities']);
Route::get('/cities', [LocationController::class, 'cities']);
Route::get('/cities/{city}', [LocationController::class, 'showCity']);

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/profile/avatar', [ProfileController::class, 'removeAvatar']);

    Route::get('/reports', [ReportController::class, 'index'])->middleware('role:user');
    Route::get('/reports/{report}', [ReportController::class, 'show'])->middleware('role:user');
    Route::post('/events/{event}/report', [ReportController::class, 'store'])->middleware('role:user');

    Route::get('/dashboard', [DashboardController::class, 'userDashboard'])->middleware('role:user');
    Route::get('/recommendations', [RecommendationController::class, 'index'])->middleware('role:user');
    Route::get('/organizer/dashboard', [DashboardController::class, 'organizerDashboard'])->middleware('role:organizer');
    Route::get('/admin/dashboard', [DashboardController::class, 'adminDashboard'])->middleware('role:admin');

    Route::get('/notification-preferences', [NotificationController::class, 'preferences']);
    Route::put('/notification-preferences', [NotificationController::class, 'updatePreferences']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);

    Route::get('/bookmarks', [BookmarkController::class, 'index'])->middleware('role:user');
    Route::post('/events/{event}/bookmark', [BookmarkController::class, 'store'])->middleware('role:user');
    Route::delete('/events/{event}/bookmark', [BookmarkController::class, 'destroy'])->middleware('role:user');

    Route::get('/payments', [PaymentController::class, 'index'])->middleware('role:user');
    Route::get('/payments/{payment}', [PaymentController::class, 'show'])->middleware('role:user');
    Route::post('/payments/{payment}/initiate', [PaymentController::class, 'initiate'])->middleware('role:user');
    Route::post('/payments/{payment}/confirm', [PaymentController::class, 'confirm'])->middleware('role:user');
    Route::get('/payments/{payment}/status', [PaymentController::class, 'status'])->middleware('role:user');

    Route::get('/registrations', [RegistrationController::class, 'index'])->middleware('role:user');
    Route::get('/registrations/{registration}', [RegistrationController::class, 'show'])->middleware('role:user');
    Route::post('/events/{event}/register', [RegistrationController::class, 'store'])->middleware('role:user');
    Route::delete('/events/{event}/registration', [RegistrationController::class, 'destroy'])->middleware('role:user');

    Route::get('/organizer/events', [EventController::class, 'myEvents'])->middleware('role:organizer');
    Route::get('/organizer/events/{event}', [EventController::class, 'organizerShow'])->middleware('role:organizer,admin');
    Route::get('/organizer/events/{event}/attendees', [EventController::class, 'attendees'])->middleware('role:organizer,admin');
    Route::post('/events', [EventController::class, 'store'])->middleware('role:organizer,admin');
    Route::put('/events/{event}', [EventController::class, 'update'])->middleware('role:organizer,admin');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->middleware('role:organizer,admin');
    Route::post('/events/{event}/images', [EventController::class, 'uploadImages'])->middleware('role:organizer,admin');
    Route::delete('/events/{event}/images/{image}', [EventController::class, 'deleteImage'])->middleware('role:organizer,admin');
    Route::patch('/admin/events/{event}/status', [EventController::class, 'updateStatus'])->middleware('role:admin');

    Route::get('/me/interests', [InterestController::class, 'myInterests'])->middleware('role:user');
    Route::post('/me/interests', [InterestController::class, 'syncMyInterests'])->middleware('role:user');

    Route::middleware('role:admin')->group(function () {

        Route::get('/admin/feedback', [AdminController::class, 'feedbacks']);
        Route::patch('/admin/feedback/{feedback}/status', [AdminController::class, 'updateFeedbackStatus']);

        Route::get('/admin/announcements', [AdminController::class, 'announcements']);
        Route::post('/admin/announcements', [AdminController::class, 'storeAnnouncement']);
        Route::patch('/admin/announcements/{announcement}/send', [AdminController::class, 'sendAnnouncement']);

        Route::get('/admin/users', [AdminController::class, 'users']);
        Route::patch('/admin/users/{user}/role', [AdminController::class, 'updateUserRole']);
        Route::patch('/admin/users/{user}/status', [AdminController::class, 'updateUserStatus']);

        Route::get('/admin/events', [AdminController::class, 'events']);

        Route::get('/admin/reports', [AdminController::class, 'reports']);
        Route::patch('/admin/reports/{report}/status', [AdminController::class, 'updateReportStatus']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        Route::post('/interests', [InterestController::class, 'store']);
        Route::put('/interests/{interest}', [InterestController::class, 'update']);
        Route::delete('/interests/{interest}', [InterestController::class, 'destroy']);

        Route::post('/regions', [LocationController::class, 'storeRegion']);
        Route::put('/regions/{region}', [LocationController::class, 'updateRegion']);
        Route::delete('/regions/{region}', [LocationController::class, 'destroyRegion']);

        Route::post('/divisions', [LocationController::class, 'storeDivision']);
        Route::put('/divisions/{division}', [LocationController::class, 'updateDivision']);
        Route::delete('/divisions/{division}', [LocationController::class, 'destroyDivision']);

        Route::post('/cities', [LocationController::class, 'storeCity']);
        Route::put('/cities/{city}', [LocationController::class, 'updateCity']);
        Route::delete('/cities/{city}', [LocationController::class, 'destroyCity']);
    });

    // Role middleware test endpoints. You may remove these later.
    Route::get('/role-test/user', fn () => response()->json(['message' => 'User role accepted.']))->middleware('role:user');
    Route::get('/role-test/organizer', fn () => response()->json(['message' => 'Organizer role accepted.']))->middleware('role:organizer');
    Route::get('/role-test/admin', fn () => response()->json(['message' => 'Admin role accepted.']))->middleware('role:admin');
    Route::get('/role-test/organizer-or-admin', fn () => response()->json(['message' => 'Organizer or admin role accepted.']))->middleware('role:organizer,admin');
});
