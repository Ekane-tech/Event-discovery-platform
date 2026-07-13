# React Profile API Integration Guide

Profile pages now use the Laravel Profile API.

## Files added

```text
src/features/profile/services/profileService.js
src/features/profile/hooks/useProfileApi.js
```

## Files modified

```text
src/features/auth/context/AuthContext.jsx
src/features/profile/pages/ProfilePage.jsx
src/features/profile/pages/EditProfilePage.jsx
src/features/settings/pages/LanguageSettingsPage.jsx
```

## Backend endpoints used

```text
GET /api/profile
PUT /api/profile
```

## Notes

- AuthContext now has `updateUserProfile()` that calls Laravel.
- Profile page fetches Laravel profile.
- Edit profile page saves to Laravel.
- Language settings saves through the same profile endpoint.
