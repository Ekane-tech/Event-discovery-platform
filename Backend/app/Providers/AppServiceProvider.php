<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Schema::defaultStringLength(191);

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

            return $frontendUrl.'/reset-password?token='.$token.'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
