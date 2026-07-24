<?php

namespace Tests\Unit\Models;

use App\Models\NotificationPreference;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_has_role_returns_true_for_matching_role(): void
    {
        $role = Role::create(['name' => 'organizer', 'label' => 'Organizer']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertTrue($user->hasRole('organizer'));
    }

    public function test_has_role_returns_false_for_different_role(): void
    {
        $role = Role::create(['name' => 'attendee', 'label' => 'Attendee']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $this->assertFalse($user->hasRole('admin'));
    }

    public function test_has_role_returns_false_when_user_has_no_role(): void
    {
        $user = User::factory()->create(['role_id' => null]);

        $this->assertFalse($user->hasRole('admin'));
    }

    public function test_notification_preferences_creates_a_row_once_and_reuses_it(): void
    {
        $user = User::factory()->create();

        $this->assertDatabaseCount('notification_preferences', 0);

        $first = $user->notificationPreferences();
        $second = $user->fresh()->notificationPreferences();

        $this->assertInstanceOf(NotificationPreference::class, $first);
        $this->assertSame($first->id, $second->id);
        $this->assertDatabaseCount('notification_preferences', 1);
        $this->assertSame($user->id, $first->user_id);
    }
}
