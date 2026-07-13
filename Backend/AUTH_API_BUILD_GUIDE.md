# Laravel Authentication API with Sanctum — Build Guide

This folder contains the authentication API files to copy into a real Laravel backend project.

## Important note

The current environment does not have PHP or Composer installed, so the Laravel project could not be created or executed here. These files are prepared so you can copy them into a Laravel project after running:

```bash
composer create-project laravel/laravel backend
cd backend
composer require laravel/sanctum
php artisan install:api
php artisan migrate
```

## Endpoints created

```text
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/logout-all
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

## Files created

```text
routes/api.php
app/Http/Controllers/Api/AuthController.php
app/Http/Requests/Auth/RegisterRequest.php
app/Http/Requests/Auth/LoginRequest.php
app/Http/Requests/Auth/ForgotPasswordRequest.php
app/Http/Requests/Auth/ResetPasswordRequest.php
app/Http/Resources/UserResource.php
app/Models/User.php
app/Models/Role.php
app/Models/Profile.php
database/migrations/2026_07_06_000001_create_roles_table.php
database/migrations/2026_07_06_000002_add_role_id_to_users_table.php
database/migrations/2026_07_06_000003_create_profiles_table.php
database/seeders/RoleSeeder.php
database/seeders/DemoUserSeeder.php
database/seeders/DatabaseSeeder.php
```

## Demo API users

The seeded demo users use password:

```text
password1
```

```text
user@example.com
organizer@example.com
admin@example.com
```

## Register payload

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+237 699 000 000",
  "city": "Douala",
  "region": "Littoral",
  "preferred_language": "en",
  "password": "password1",
  "password_confirmation": "password1",
  "device_name": "web"
}
```

## Login payload

```json
{
  "email": "user@example.com",
  "password": "password1",
  "device_name": "web"
}
```

## Authenticated requests

Send the token as:

```text
Authorization: Bearer YOUR_TOKEN
```