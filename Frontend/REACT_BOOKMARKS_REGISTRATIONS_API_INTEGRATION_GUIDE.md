# React Bookmarks + Registrations API Integration Guide

## Frontend files added

```text
src/features/bookmarks/services/bookmarkService.js
src/features/registrations/services/registrationService.js
```

## Frontend files modified

```text
src/features/bookmarks/hooks/useMockBookmarks.js
src/features/registrations/hooks/useMockRegistrations.js
src/features/events/components/EventActionPanel.jsx
src/features/bookmarks/pages/BookmarksPage.jsx
src/features/registrations/pages/MyRegistrationsPage.jsx
src/features/registrations/pages/RegistrationDetailsPage.jsx
src/features/registrations/pages/TicketPage.jsx
```

## Backend files modified for organizer edit fix

```text
app/Http/Controllers/Api/EventController.php
routes/api.php
```

## Backend endpoints used

```text
GET    /api/bookmarks
POST   /api/events/{event}/bookmark
DELETE /api/events/{event}/bookmark
GET    /api/registrations
GET    /api/registrations/{registration}
POST   /api/events/{event}/register
DELETE /api/events/{event}/registration
GET    /api/organizer/events/{event}
```

## Notes

- User event action panel now uses Laravel for bookmark/register/cancel.
- Bookmarks page uses Laravel.
- Registrations page, details page, and ticket page use Laravel.
- Organizer edit fix adds `/api/organizer/events/{event}` so pending/private organizer events can be edited.
