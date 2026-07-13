# React Auth API Integration Guide

React authentication now uses the Laravel Sanctum API instead of mock users.

## Files added

```text
src/features/auth/utils/normalizeAuthUser.js
```

## Files modified

```text
.env.example
src/shared/constants/app.js
src/features/auth/context/AuthContext.jsx
src/features/auth/services/authService.js
src/features/auth/pages/LoginPage.jsx
src/features/auth/pages/RegisterPage.jsx
src/features/auth/components/DemoAccountSelector.jsx
src/features/auth/components/PasswordChecklist.jsx
src/app/router/ProtectedRoute.jsx
src/app/router/RoleRoute.jsx
```

## Required environment

Create/update `.env` in the frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_APP_NAME=Event Discovery Platform
```

Restart Vite after changing `.env`.

## Backend required

Laravel must be running:

```bash
php artisan serve
```

Seeded demo users use password:

```text
password1
```

## localStorage keys

```text
auth_token
auth_user
```

## Test

1. Start Laravel backend on port 8000.
2. Start React frontend.
3. Visit `/login`.
4. Click a demo account.
5. Login with password `password1`.
6. You should be redirected by backend role:
   - user -> `/dashboard`
   - organizer -> `/organizer/dashboard`
   - admin -> `/admin/dashboard`
