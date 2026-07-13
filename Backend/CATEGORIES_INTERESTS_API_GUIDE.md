# Categories + Interests API Guide

## Files added

```text
app/Http/Requests/Category/StoreCategoryRequest.php
app/Http/Requests/Category/UpdateCategoryRequest.php
app/Http/Requests/Interest/StoreInterestRequest.php
app/Http/Requests/Interest/UpdateInterestRequest.php
app/Http/Requests/Interest/SyncUserInterestsRequest.php
database/migrations/2026_07_10_000001_add_metadata_to_categories_and_interests_tables.php
```

## Files modified

```text
app/Models/Category.php
app/Models/Interest.php
app/Models/User.php
app/Http/Resources/CategoryResource.php
app/Http/Resources/InterestResource.php
app/Http/Controllers/Api/CategoryController.php
app/Http/Controllers/Api/InterestController.php
database/seeders/CategorySeeder.php
database/seeders/InterestSeeder.php
database/seeders/DatabaseSeeder.php
routes/api.php
```

## Public endpoints

```text
GET /api/categories
GET /api/categories/{category}
GET /api/interests
GET /api/interests/{interest}
```

## User endpoints

Requires user role:

```text
GET /api/me/interests
POST /api/me/interests
```

Payload:

```json
{
  "interest_ids": [1, 2, 3]
}
```

## Admin endpoints

Requires admin role:

```text
POST /api/categories
PUT /api/categories/{category}
DELETE /api/categories/{category}
POST /api/interests
PUT /api/interests/{interest}
DELETE /api/interests/{interest}
```

## Commands after copying files

```bash
php artisan optimize:clear
php artisan migrate
php artisan db:seed --class=CategorySeeder
php artisan db:seed --class=InterestSeeder
```

If you are still in development and can reset data:

```bash
php artisan migrate:fresh --seed
```