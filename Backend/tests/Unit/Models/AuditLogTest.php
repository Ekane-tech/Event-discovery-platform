<?php

namespace Tests\Unit\Models;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_record_persists_actor_auditable_and_metadata(): void
    {
        $actor = User::factory()->create();

        $log = AuditLog::record($actor, 'user.updated', $actor, 'User was updated.', ['field' => 'name']);

        $this->assertSame($actor->id, $log->actor_id);
        $this->assertSame('user.updated', $log->action);
        $this->assertSame(User::class, $log->auditable_type);
        $this->assertSame($actor->id, $log->auditable_id);
        $this->assertSame('User was updated.', $log->description);
        $this->assertSame(['field' => 'name'], $log->metadata);
    }

    public function test_record_supports_null_actor_and_no_auditable(): void
    {
        $log = AuditLog::record(null, 'system.event');

        $this->assertNull($log->actor_id);
        $this->assertNull($log->auditable_type);
        $this->assertNull($log->auditable_id);
        $this->assertSame('', $log->description);
        $this->assertNull($log->metadata);
    }

    public function test_record_stores_empty_metadata_as_null(): void
    {
        $log = AuditLog::record(null, 'system.event', null, 'No metadata', []);

        $this->assertNull($log->metadata);
    }
}
