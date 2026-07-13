# Reports API Guide

## Files added/modified

```text
app/Http/Requests/Report/StoreReportRequest.php
app/Http/Controllers/Api/ReportController.php
app/Models/Report.php
routes/api.php
```

## User endpoints

All require `auth:sanctum` and `role:user`.

```text
GET  /api/reports
GET  /api/reports/{report}
POST /api/events/{event}/report
```

## Report event payload

```json
{
  "type": "fake_event",
  "message": "This event looks suspicious."
}
```

## Valid report types

```text
fake_event
wrong_information
wrong_location
inappropriate_content
duplicate_event
scam_or_fraud
other
```

## Rules

- Only normal users can create reports.
- Organizers and admins are blocked by `role:user`.
- Users can report only published public events.
- Duplicate open reports from the same user for the same event are prevented.
- Admin can review reports through the existing Admin Management APIs:

```text
GET   /api/admin/reports
PATCH /api/admin/reports/{report}/status
```

## Commands after copying

```bash
php artisan optimize:clear
```

No migration is required because the `reports` table already exists.