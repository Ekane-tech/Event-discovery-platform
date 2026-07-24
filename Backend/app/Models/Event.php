<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory;

    /**
     * Relations eager-loaded when returning a single event via EventResource.
     */
    public const DETAIL_RELATIONS = [
        'organizer.role',
        'organizer.profile',
        'category',
        'categories',
        'region',
        'division',
        'city',
        'images',
    ];

    protected $fillable = [
        'organizer_id',
        'category_id',
        'region_id',
        'division_id',
        'city_id',
        'title',
        'slug',
        'description',
        'venue',
        'latitude',
        'longitude',
        'start_date',
        'end_date',
        'registration_deadline',
        'price',
        'maximum_participants',
        'status',
        'visibility',
        'views',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'registration_deadline' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'price' => 'decimal:2',
            'views' => 'integer',
            'maximum_participants' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Event $event) {
            if (! $event->slug && $event->title) {
                $event->slug = static::generateUniqueSlug($event->title);
            }
        });

        static::updating(function (Event $event) {
            if ($event->isDirty('title')) {
                $event->slug = static::generateUniqueSlug($event->title, $event->id);
            }
        });
    }

    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'event_categories')->withTimestamps();
    }

    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function images()
    {
        return $this->hasMany(EventImage::class);
    }

    public function ticketTypes()
    {
        return $this->hasMany(EventTicketType::class)->orderBy('sort_order')->orderBy('price');
    }

    public function registrations()
    {
        return $this->hasMany(Registration::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function eventViews()
    {
        return $this->hasMany(EventView::class);
    }

    public function reviews()
    {
        return $this->hasMany(EventReview::class);
    }

    public function scopePublishedPublic($query)
    {
        return $query->where('status', 'published')->where('visibility', 'public');
    }

    /**
     * Determine whether the given user may manage (edit/delete) this event.
     */
    public function isManageableBy(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasRole('admin')
            || ($user->hasRole('organizer') && (int) $this->organizer_id === (int) $user->id);
    }
}
