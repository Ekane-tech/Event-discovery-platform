<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use App\Models\EmailLog;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Mail;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Event::listen(NotificationFailed::class, function (NotificationFailed $event) {
            if ($event->channel !== 'mail') {
                return;
            }
            if (app()->environment('production')) {
                \Illuminate\Support\Facades\URL::forceScheme('https');
            }

            $notifiable = $event->notifiable;
            EmailLog::create([
                'user_id' => $notifiable->id ?? null,
                'recipient' => method_exists($notifiable, 'routeNotificationForMail')
                    ? (string) $notifiable->routeNotificationForMail()
                    : (string) ($notifiable->email ?? 'unknown'),
                'subject' => class_basename($event->notification),
                'type' => class_basename($event->notification),
                'status' => 'failed',
                'error_message' => $event->data['message'] ?? 'Email notification failed.',
                'metadata' => ['notification' => get_class($event->notification)],
            ]);
        });

        Mail::extend('brevo', function (array $config) {
            return new \Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoApiTransport(
                $config['key']
            );
        });


        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

            return $frontendUrl.'/reset-password?token='.$token.'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });

        RateLimiter::for('public-read', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        RateLimiter::for('auth-login', function (Request $request) {
            $email = strtolower((string) $request->input('email'));
            return Limit::perMinute(5)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('auth-register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        RateLimiter::for('password-reset', function (Request $request) {
            $email = strtolower((string) $request->input('email'));
            return Limit::perMinute(3)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('email-verification', function (Request $request) {
            return Limit::perMinute(6)->by(($request->user()?->id ?: $request->ip()).'|email-verification');
        });

        RateLimiter::for('feedback-submit', function (Request $request) {
            $email = strtolower((string) $request->input('email'));
            return Limit::perMinute(5)->by(($email ?: 'guest').'|'.$request->ip());
        });

        RateLimiter::for('ticket-verify', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('authenticated-read', function (Request $request) {
            return Limit::perMinute(180)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('event-write', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('file-upload', function (Request $request) {
            return Limit::perMinute(15)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('payments', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('check-in', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('admin-actions', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });
    }
}
