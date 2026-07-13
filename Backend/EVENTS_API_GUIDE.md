# Events API Guide

## Files added/modified

```text
app/Models/Event.php
app/Models/EventImage.php
app/Http/Resources/EventResource.php
app/Http/Resources/EventImageResource.php
app/Http/Requests/Event/StoreEventRequest.php
app/Http/Requests/Event/UpdateEventRequest.php
app/Http/Controllers/Api/EventController.php
routes/api.php
```

## Public endpoints

```text
GET /api/events
GET /api/events/{event}
```

## Protected endpoints

Organizer or admin:

```text
GET /api/organizer/events
POST /api/events
PUT /api/events/{event}
DELETE /api/events/{event}
```

Admin only:

```text
PATCH /api/admin/events/{event}/status
```

## Filters for GET /api/events

```text
keyword
category_id
region_id
division_id
city_id
organizer_id
price=free|paid
date=today|week|month|upcoming
status draft|pending|published|rejected|cancelled admin only
sort=upcoming|latest|popular|price_low|price_high
per_page=12
```

## Create event example payload

```json
{
  "title": "Douala Tech Summit",
  "description": "A conference for developers and founders.",
  "category_id": 1,
  "category_ids": [1, 2],
  "region_id": 1,
  "division_id": 1,
  "city_id": 1,
  "venue": "Bonanjo Conference Hall",
  "latitude": 4.0511,
  "longitude": 9.7679,
  "start_date": "2026-08-15 08:00:00",
  "end_date": "2026-08-15 18:00:00",
  "registration_deadline": "2026-08-10 23:59:00",
  "price": 0,
  "maximum_participants": 500,
  "status": "pending",
  "visibility": "public",
  "images": [
    { "path": "events/cover.jpg", "type": "cover", "is_cover": true }
  ]
}
```

## Commands after copying

```bash
php artisan optimize:clear
```

No new migration is required for this module because the events tables already exist.