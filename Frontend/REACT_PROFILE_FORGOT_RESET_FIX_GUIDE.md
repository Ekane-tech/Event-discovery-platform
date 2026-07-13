# React Profile + Forgot/Reset Fix Guide

## Fixes

1. Profile edit fields were empty because the Profile API returns a flat profile object, while the frontend normalizer expected nested `profile` fields. `normalizeAuthUser.js` now supports both shapes.
2. Forgot password page now calls Laravel `POST /api/auth/forgot-password`.
3. Reset password page now calls Laravel `POST /api/auth/reset-password`.

## Files modified

```text
src/shared/api/apiEndpoints.js
src/features/auth/services/authService.js
src/features/auth/utils/normalizeAuthUser.js
src/features/auth/pages/ForgotPasswordPage.jsx
src/features/auth/pages/ResetPasswordPage.jsx
```

## Laravel mail setup for local reset links

In backend `.env`, use:

```env
MAIL_MAILER=log
```

Then run forgot password and check:

```text
storage/logs/laravel.log
```

Copy the reset URL from the log. It should contain `token` and `email`.
