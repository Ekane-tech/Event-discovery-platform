# Notifications API Guide

## Files added/modified

```text
database/migrations/2026_07_10_000002_create_notifications_table.php
app/Http/Resources/NotificationResource.php
app/Http/Controllers/Api/NotificationController.php
app/Notifications/EventInterestMatchNotification.php
app/Jobs/SendEventInterestNotificationsJob.php
app/Http/Controllers/Api/EventController.php
routes/api.php
```

## Endpoints

All require `auth:sanctum`:

```text
GET   /api/notifications
PATCH /api/notifications/{id}/read
PATCH /api/notifications/read-all
```

## Query filters

```text
GET /api/notifications?status=unread
GET /api/notifications?status=read
GET /api/notifications?per_page=15
```

## Notification engine

When an event becomes `published` and `public`, the backend dispatches:

```php
SendEventInterestNotificationsJob::dispatch($event->id);
```

The job notifies users whose selected interests match the event category by name or slug.

## Commands after copying

```bash
php artisan optimize:clear
php artisan migrate
```

If using database queue:

```bash
php artisan queue:work
```

If `QUEUE_CONNECTION=sync`, notifications are created immediately during the request.
