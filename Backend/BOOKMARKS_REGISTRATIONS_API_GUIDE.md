# Bookmarks + Registrations API Guide

## Files added/modified

```text
app/Models/Bookmark.php
app/Models/Registration.php
app/Models/User.php
app/Http/Resources/BookmarkResource.php
app/Http/Resources/RegistrationResource.php
app/Http/Controllers/Api/BookmarkController.php
app/Http/Controllers/Api/RegistrationController.php
routes/api.php
```

## Endpoints

All endpoints require `auth:sanctum` and `role:user`.

```text
GET    /api/bookmarks
POST   /api/events/{event}/bookmark
DELETE /api/events/{event}/bookmark

GET    /api/registrations
GET    /api/registrations/{registration}
POST   /api/events/{event}/register
DELETE /api/events/{event}/registration
```

## Rules

- Only users can bookmark/register.
- Organizers/admins are blocked by `role:user`.
- Only published public events can be bookmarked or registered for.
- Registration checks deadline, start date, capacity, and duplicate registration.
- Ticket numbers are generated automatically.

## Commands after copying

```bash
php artisan optimize:clear
```

No migration is required because `bookmarks` and `registrations` tables already exist.
