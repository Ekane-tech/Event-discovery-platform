<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        return (new MailMessage)
            ->subject('Verify your email address')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Thanks for creating your account. Please verify your email address to secure your account and receive important updates.')
            ->action('Verify email address', $verificationUrl)
            ->line('This verification link expires in 60 minutes.')
            ->line('If you did not create this account, you can ignore this email.');
    }
}
