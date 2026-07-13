# Admin Management APIs Guide

## Files added/modified

```text
database/migrations/2026_07_10_000003_add_status_to_users_table.php
app/Http/Requests/Admin/UpdateUserRoleRequest.php
app/Http/Requests/Admin/UpdateUserStatusRequest.php
app/Http/Requests/Admin/UpdateReportStatusRequest.php
app/Http/Resources/ReportResource.php
app/Http/Resources/UserResource.php
app/Models/User.php
app/Http/Controllers/Api/AdminController.php
routes/api.php
```

## Endpoints

All require `auth:sanctum` and `role:admin`.

```text
GET   /api/admin/users
PATCH /api/admin/users/{user}/role
PATCH /api/admin/users/{user}/status

GET   /api/admin/events

GET   /api/admin/reports
PATCH /api/admin/reports/{report}/status
```

## User status values

```text
active
pending_approval
suspended
```

## User role payload

```json
{ "role": "organizer" }
```

## User status payload

```json
{ "status": "suspended" }
```

## Report status values

```text
open
reviewing
resolved
rejected
```

## Commands after copying

```bash
php artisan optimize:clear
php artisan migrate
```

If resetting database:

```bash
php artisan migrate:fresh --seed
```
