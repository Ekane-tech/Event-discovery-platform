# Role Middleware + Profile API Guide

## Files added

```text
app/Http/Middleware/EnsureUserHasRole.php
app/Http/Resources/ProfileResource.php
bootstrap/app.role-middleware-example.php
```

## Files modified

```text
routes/api.php
app/Http/Controllers/Api/ProfileController.php
app/Http/Requests/Profile/UpdateProfileRequest.php
```

## Important: register the role middleware alias

Open your real Laravel file:

```text
bootstrap/app.php
```

Find the `->withMiddleware(...)` section and add this alias:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'role' => \App\Http\Middleware\EnsureUserHasRole::class,
    ]);
})
```

If your `bootstrap/app.php` already has code inside `withMiddleware`, only add the `$middleware->alias([...])` part inside it.

## New endpoints

```text
GET /api/profile
PUT /api/profile
```

Both require:

```text
Authorization: Bearer YOUR_TOKEN
```

## Role middleware examples

```php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'users']);
});

Route::middleware(['auth:sanctum', 'role:organizer,admin'])->group(function () {
    Route::post('/events', [EventController::class, 'store']);
});
```

## Test endpoints included

```text
GET /api/role-test/user
GET /api/role-test/organizer
GET /api/role-test/admin
GET /api/role-test/organizer-or-admin
```

You can remove these later after testing.

## PowerShell test: get profile

```powershell
$login = Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/auth/login `
  -Headers @{
    "Accept" = "application/json"
    "Content-Type" = "application/json"
  } `
  -Body '{
    "email": "user@example.com",
    "password": "password1",
    "device_name": "web"
  }'

$token = $login.token

Invoke-RestMethod -Method Get http://127.0.0.1:8000/api/profile `
  -Headers @{
    "Accept" = "application/json"
    "Authorization" = "Bearer $token"
  } | ConvertTo-Json -Depth 10
```

## PowerShell test: update profile

```powershell
Invoke-RestMethod -Method Put http://127.0.0.1:8000/api/profile `
  -Headers @{
    "Accept" = "application/json"
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
  } `
  -Body '{
    "name": "Demo User Updated",
    "phone": "+237 699 111 222",
    "city": "Douala",
    "region": "Littoral",
    "avatar": null,
    "bio": "I love technology and business events.",
    "preferred_language": "en"
  }' | ConvertTo-Json -Depth 10
```

## PowerShell test: role middleware

With `user@example.com`, this should work:

```powershell
Invoke-RestMethod -Method Get http://127.0.0.1:8000/api/role-test/user `
  -Headers @{
    "Accept" = "application/json"
    "Authorization" = "Bearer $token"
  }
```

With `user@example.com`, this should return 403 Forbidden:

```powershell
Invoke-RestMethod -Method Get http://127.0.0.1:8000/api/role-test/admin `
  -Headers @{
    "Accept" = "application/json"
    "Authorization" = "Bearer $token"
  }
```
