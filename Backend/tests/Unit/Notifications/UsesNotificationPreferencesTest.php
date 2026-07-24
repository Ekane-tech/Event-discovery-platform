<?php

namespace Tests\Unit\Notifications;

use App\Notifications\Concerns\UsesNotificationPreferences;
use Tests\TestCase;

class UsesNotificationPreferencesTest extends TestCase
{
    private object $harness;

    protected function setUp(): void
    {
        parent::setUp();

        $this->harness = new class
        {
            use UsesNotificationPreferences;

            public function channels(object $notifiable, ?string $feature = null): array
            {
                return $this->channelsFor($notifiable, $feature);
            }

            public function url(string $path = ''): string
            {
                return $this->frontendUrl($path);
            }
        };
    }

    public function test_notifiable_without_preferences_gets_default_channels(): void
    {
        $notifiable = new class
        {
            // No notificationPreference() method: defaults apply.
        };

        $this->assertSame(['database', 'mail'], $this->harness->channels($notifiable));
    }

    public function test_disabled_feature_preference_returns_no_channels(): void
    {
        $notifiable = $this->notifiableWithPreference([
            'interest_matches' => false,
            'database' => true,
            'email' => true,
        ]);

        $this->assertSame([], $this->harness->channels($notifiable, 'interest_matches'));
    }

    public function test_enabled_feature_respects_channel_toggles(): void
    {
        $notifiable = $this->notifiableWithPreference([
            'interest_matches' => true,
            'database' => true,
            'email' => false,
        ]);

        $this->assertSame(['database'], $this->harness->channels($notifiable, 'interest_matches'));
    }

    public function test_channels_omit_disabled_database_channel(): void
    {
        $notifiable = $this->notifiableWithPreference([
            'database' => false,
            'email' => true,
        ]);

        $this->assertSame(['mail'], $this->harness->channels($notifiable));
    }

    public function test_frontend_url_joins_path_without_duplicate_slashes(): void
    {
        putenv('FRONTEND_URL=https://app.example.com/');

        try {
            $this->assertSame('https://app.example.com/events/5', $this->harness->url('/events/5'));
            $this->assertSame('https://app.example.com/', $this->harness->url());
        } finally {
            putenv('FRONTEND_URL');
        }
    }

    private function notifiableWithPreference(array $attributes): object
    {
        $preference = (object) $attributes;

        return new class($preference)
        {
            public function __construct(private object $preference) {}

            public function notificationPreference(): object
            {
                return new class($this->preference)
                {
                    public function __construct(private object $preference) {}

                    public function firstOrCreate(array $attributes = []): object
                    {
                        return $this->preference;
                    }
                };
            }
        };
    }
}
