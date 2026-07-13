# Dashboard APIs Guide

## Files added/modified

```text
app/Models/Report.php
app/Http/Controllers/Api/DashboardController.php
routes/api.php
```

## Endpoints

All require `auth:sanctum`.

```text
GET /api/dashboard              role:user
GET /api/organizer/dashboard    role:organizer,admin
GET /api/admin/dashboard        role:admin
```

## User dashboard response includes

```text
summary
upcoming_registrations
recent_bookmarks
recent_notifications
recommended_events
```

## Organizer dashboard response includes

```text
summary
recent_events
upcoming_events
```

## Admin dashboard response includes

```text
summary
recent_users
events_needing_review
recent_reports
```

## Commands after copying

```bash
php artisan optimize:clear
```

No migration is required.
