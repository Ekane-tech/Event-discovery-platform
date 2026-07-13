# React Interests API Integration Guide

Interests now use Laravel API endpoints.

## Frontend files added

```text
src/features/interests/services/interestService.js
```

## Frontend files modified

```text
src/features/interests/hooks/useMockInterests.js
src/features/interests/pages/ChooseInterestsPage.jsx
src/features/interests/pages/MyInterestsPage.jsx
```

## Backend file modified

```text
app/Http/Requests/Interest/SyncUserInterestsRequest.php
```

This backend change allows saving an empty interest list to clear user interests.

## Backend endpoints used

```text
GET /api/interests
GET /api/me/interests
POST /api/me/interests
```

## Notes

The existing hook name `useMockInterests` is kept to avoid changing many imports, but it now uses Laravel for authenticated normal users.