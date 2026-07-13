# Organizer Attendees API + React Integration Guide

## Backend files modified

```text
app/Http/Controllers/Api/EventController.php
routes/api.php
```

## Frontend files modified

```text
src/features/events/services/eventService.js
src/features/dashboard/organizer/pages/OrganizerAttendeesPage.jsx
```

## Endpoint added

```text
GET /api/organizer/events/{event}/attendees
```

Requires:

```text
auth:sanctum
role:organizer,admin
```

## Response includes

```text
event
summary
attendees
```

## Summary fields

```text
registrations_count
confirmed_count
cancelled_count
capacity
available_places
```
