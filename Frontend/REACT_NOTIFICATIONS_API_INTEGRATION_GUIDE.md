# React Notifications API Integration Guide

## Backend files added/modified

```text
app/Notifications/EventUnavailableNotification.php
app/Http/Controllers/Api/EventController.php
routes/api.php
```

## Frontend files modified

```text
src/features/events/services/eventService.js
src/features/events/pages/EditEventPage.jsx
src/features/notifications/services/notificationService.js
src/features/notifications/hooks/useMockNotifications.js
src/features/notifications/components/NotificationItem.jsx
src/features/notifications/pages/NotificationsPage.jsx
```

## Fixes

- Organizer edit now uses `GET /api/organizer/events/{event}` instead of public `GET /api/events/{event}`.
- When an event becomes unavailable, backend deletes bookmarks for that event.
- Registered users receive a database notification when an event becomes private/unpublished/rejected/cancelled.
- React notifications now use Laravel:
  - `GET /api/notifications`
  - `PATCH /api/notifications/{id}/read`
  - `PATCH /api/notifications/read-all`
