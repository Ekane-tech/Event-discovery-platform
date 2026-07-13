# React Dashboard API Integration Guide

## Backend files modified

```text
app/Http/Controllers/Api/EventController.php
```

## Frontend files added

```text
src/features/dashboard/services/dashboardService.js
```

## Frontend files modified

```text
src/features/registrations/pages/TicketPage.jsx
src/features/dashboard/user/pages/UserDashboardPage.jsx
src/features/dashboard/organizer/pages/OrganizerDashboardPage.jsx
src/features/dashboard/admin/pages/AdminDashboardPage.jsx
```

## Fixes

- Cancelled/private/unpublished events now remove bookmarks.
- Registrations are marked `cancelled_by_event` when event becomes unavailable.
- Registered users receive a notification.
- Ticket page no longer links to event details if event is unavailable, preventing 404.
- Dashboards now use Laravel APIs.
