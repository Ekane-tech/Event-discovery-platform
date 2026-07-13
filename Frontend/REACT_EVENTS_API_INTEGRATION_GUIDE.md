# React Events API Integration Guide

Events pages now use Laravel Events API.

## Files added

```text
src/features/events/utils/normalizeEvent.js
src/features/categories/services/categoryService.js
src/features/locations/services/locationService.js
```

## Files modified

```text
src/features/events/services/eventService.js
src/features/search/hooks/useEventSearch.js
src/features/search/components/EventFilters.jsx
src/features/events/components/EventCard.jsx
src/features/events/components/EventStatsPanel.jsx
src/features/events/components/EventForm.jsx
src/features/events/components/OrganizerEventCard.jsx
src/features/events/pages/BrowseEventsPage.jsx
src/features/search/pages/SearchResultsPage.jsx
src/features/events/pages/EventDetailsPage.jsx
src/features/events/pages/CreateEventPage.jsx
src/features/events/pages/EditEventPage.jsx
src/features/events/pages/MyEventsPage.jsx
```

## Backend endpoints used

```text
GET /api/events
GET /api/events/{event}
GET /api/organizer/events
POST /api/events
PUT /api/events/{event}
DELETE /api/events/{event}
GET /api/categories
GET /api/regions
GET /api/divisions
GET /api/cities
```

## Notes

- Event browse/search/details are connected to Laravel.
- Organizer My Events/Create/Edit/Delete are connected to Laravel.
- User bookmark/register buttons are still mock and should be connected in the next integration.
- Organizer publish/unpublish uses normal event update for organizer-owned events. Admin moderation remains backend-only for now.
