# Role Separation Fix Guide

This update fixes role confusion between registered users, organizers, and administrators.

## What changed

- `/dashboard` is now only for registered users.
- Admins are redirected to `/admin/dashboard` if they try user-only pages.
- Organizers are redirected to `/organizer/dashboard` if they try user-only pages.
- Bookmarks, registrations, tickets, interests, and recommendations are user-only.
- Profile, settings, and notifications remain available to all authenticated roles.
- Event details no longer let organizers/admins register or bookmark events.
- Navbar/mobile/sidebar no longer shows user-only links to organizers/admins.

## Files modified

```text
src/shared/constants/navigation.js
src/features/events/components/EventActionPanel.jsx
src/app/router/AppRouter.jsx
```

## Test

- Login as admin and visit `/dashboard` → should redirect to `/admin/dashboard`.
- Login as organizer and visit `/dashboard` → should redirect to `/organizer/dashboard`.
- Login as admin/organizer and open an event details page → no bookmark/register buttons.
- Login as normal user → bookmark/register still works.