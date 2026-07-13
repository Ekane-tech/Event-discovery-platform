# Locations API Guide

## Files added/modified

```text
app/Models/Region.php
app/Models/Division.php
app/Models/City.php
app/Http/Resources/RegionResource.php
app/Http/Resources/DivisionResource.php
app/Http/Resources/CityResource.php
app/Http/Requests/Location/StoreRegionRequest.php
app/Http/Requests/Location/UpdateRegionRequest.php
app/Http/Requests/Location/StoreDivisionRequest.php
app/Http/Requests/Location/UpdateDivisionRequest.php
app/Http/Requests/Location/StoreCityRequest.php
app/Http/Requests/Location/UpdateCityRequest.php
app/Http/Controllers/Api/LocationController.php
database/seeders/RegionSeeder.php
routes/api.php
```

## Public endpoints

```text
GET /api/regions
GET /api/regions/{region}
GET /api/regions/{region}/divisions
GET /api/regions/{region}/cities
GET /api/divisions
GET /api/divisions/{division}
GET /api/divisions/{division}/cities
GET /api/cities
GET /api/cities/{city}
```

Optional query parameters:

```text
include_inactive=true
region_id=1
region_id=1&division_id=1
```

## Admin endpoints

Requires `auth:sanctum` and `role:admin`:

```text
POST /api/regions
PUT /api/regions/{region}
DELETE /api/regions/{region}
POST /api/divisions
PUT /api/divisions/{division}
DELETE /api/divisions/{division}
POST /api/cities
PUT /api/cities/{city}
DELETE /api/cities/{city}
```

## Commands after copying

```bash
php artisan optimize:clear
php artisan db:seed --class=RegionSeeder
```

If resetting database:

```bash
php artisan migrate:fresh --seed
```
