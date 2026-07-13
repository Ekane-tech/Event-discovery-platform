<?php

namespace App\Notifications\Concerns;

trait UsesNotificationPreferences
{
    protected function channelsFor(object $notifiable, ?string $featurePreference = null): array
    {
        $preference = method_exists($notifiable, 'notificationPreference')
            ? $notifiable->notificationPreference()->firstOrCreate([])
            : null;

        $featureAllowed = ! $featurePreference || ! $preference || (bool) $preference->{$featurePreference};

        if (! $featureAllowed) {
            return [];
        }

        $channels = [];

        if (! $preference || $preference->database) {
            $channels[] = 'database';
        }

        if (! $preference || $preference->email) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    protected function frontendUrl(string $path = ''): string
    {
        return rtrim((string) env('FRONTEND_URL', config('app.url')), '/').'/'.ltrim($path, '/');
    }
}
