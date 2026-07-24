<?php

namespace Tests\Unit\Models;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventModelTest extends TestCase
{
    use RefreshDatabase;

    private function makeEvent(array $overrides = []): Event
    {
        $organizer = User::factory()->create();

        return Event::create(array_merge([
            'organizer_id' => $organizer->id,
            'title' => 'Sample Event',
            'description' => 'A description.',
            'start_date' => now()->addDay(),
        ], $overrides));
    }

    public function test_slug_is_generated_from_title_on_create(): void
    {
        $event = $this->makeEvent(['title' => 'Tech Conference 2026']);

        $this->assertSame('tech-conference-2026', $event->slug);
    }

    public function test_generate_unique_slug_appends_incrementing_suffix_on_collision(): void
    {
        $this->makeEvent(['title' => 'Music Festival']);
        $this->makeEvent(['title' => 'Music Festival']);
        $third = $this->makeEvent(['title' => 'Music Festival']);

        $this->assertSame('music-festival-3', $third->slug);
    }

    public function test_generate_unique_slug_ignores_the_given_id(): void
    {
        $event = $this->makeEvent(['title' => 'Standalone Event']);

        $slug = Event::generateUniqueSlug('Standalone Event', $event->id);

        $this->assertSame('standalone-event', $slug);
    }

    public function test_slug_regenerates_when_title_changes(): void
    {
        $event = $this->makeEvent(['title' => 'Original Title']);

        $event->update(['title' => 'Updated Title']);

        $this->assertSame('updated-title', $event->fresh()->slug);
    }

    public function test_slug_is_unchanged_when_title_is_not_dirty(): void
    {
        $event = $this->makeEvent(['title' => 'Keep This Title']);
        $originalSlug = $event->slug;

        $event->update(['venue' => 'New Venue']);

        $this->assertSame($originalSlug, $event->fresh()->slug);
    }

    public function test_published_public_scope_only_returns_published_public_events(): void
    {
        $this->makeEvent(['title' => 'Published Public', 'status' => 'published', 'visibility' => 'public']);
        $this->makeEvent(['title' => 'Draft Public', 'status' => 'draft', 'visibility' => 'public']);
        $this->makeEvent(['title' => 'Published Private', 'status' => 'published', 'visibility' => 'private']);

        $results = Event::publishedPublic()->get();

        $this->assertCount(1, $results);
        $this->assertSame('Published Public', $results->first()->title);
    }
}
