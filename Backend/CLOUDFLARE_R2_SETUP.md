# Cloudflare R2 Setup Guide for Mboa Events 237

## 🎯 Overview

This guide will walk you through setting up **Cloudflare R2** as your storage solution for the Mboa Events 237 platform. R2 is S3-compatible with **NO egress fees**, making it the most cost-effective solution for serving event images and assets to users across Cameroon and globally.

## ✅ Why Cloudflare R2?

| Feature | Cloudflare R2 | Traditional S3 | Other Storage |
|---------|---------------|---------------|---------------|
| **Egress Fees** | ❌ **$0** (FREE!) | ⚠️ ~$0.09/GB | ⚠️ Varies |
| **Global CDN** | ✅ Built-in | ❌ Extra cost | ⚠️ Varies |
| **S3 Compatible** | ✅ Yes | ✅ Yes | ❌ No |
| **Africa Performance** | ✅ **Excellent** | ⚠️ Good | ⚠️ Varies |
| **Free Tier** | 10GB storage, 1M requests/month | 5GB, limited requests | Varies |

**For Mboa Events 237:** R2 saves you money on every image view. With high traffic from event photos, this means **massive cost savings**.

---

## 🚀 Step-by-Step Cloudflare Setup (From 0 to Production)

### Step 1: Create a Cloudflare Account

1. **Go to [Cloudflare Dashboard](https://dash.cloudflare.com/sign-up)**
2. **Sign up** with your email (use a professional email for your business)
3. **Verify your email** via the confirmation link sent to your inbox
4. **Log in** to your Cloudflare account

✅ **Done:** You now have a Cloudflare account

---

### Step 2: Create an R2 Bucket

1. **Navigate to R2:**
   - In the Cloudflare dashboard, look for the left sidebar
   - Click on **"R2"** under the "Storage" section
   - If you don't see it, click **"Workers & Pages"** first, then look for R2

2. **Create a new bucket:**
   - Click **"Create bucket"** button (usually in the top-right)
   - **Bucket name:** `mboa-events-237` (or any name you prefer, must be globally unique)
   - **Storage class:** Select **"Standard"** (best for frequently accessed files like event images)
   - Click **"Create bucket"**

3. **Wait for bucket creation:**
   - This usually takes **5-10 seconds**
   - You'll see a confirmation when it's ready

✅ **Done:** Your R2 bucket is created

---

### Step 3: Get Your R2 Credentials

1. **Go to your bucket settings:**
   - Click on your newly created bucket (`mboa-events-237`)
   - Look for the **"Settings"** tab at the top

2. **Generate Access Keys:**
   - In the bucket settings, find **"Access Keys"** or **"Service Tokens"**
   - Click **"Create access key"** or **"Generate credentials"**
   - **Key name:** `mboa-events-production` (or any descriptive name)
   - **Permissions:** Select **"Read and Write"** (or full access)
   - Click **"Create"**

3. **Save your credentials (IMPORTANT!):**
   - You'll see two critical pieces of information:
     - **Access Key ID** (looks like: `abc123...`)
     - **Secret Access Key** (looks like: `xyz789...`)
   - **⚠️ COPY THESE NOW!** They will only be shown once
   - Save them in a secure password manager

4. **Get your Account ID:**
   - In the top-right corner of Cloudflare dashboard, click your account icon
   - Find **"Account ID"** (looks like: `1234567890abcdef...`)
   - Copy this - you'll need it for the endpoint

✅ **Done:** You have your R2 credentials

---

### Step 4: Configure R2 Endpoint

1. **Understand the endpoint format:**
   - Cloudflare R2 uses this format:
   ```
   https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   ```
   - Example: `https://1234567890abcdef.r2.cloudflarestorage.com`

2. **Your endpoint will be:**
   ```
   R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
   ```

✅ **Done:** You have your endpoint URL

---

### Step 5: Update Your Laravel Application

#### 5.1 Update `.env` File

Open your Laravel `.env` file and add/update these variables:

```env
# ========================================
# CLOUDFLARE R2 CONFIGURATION
# ========================================

# Set the default filesystem disk to R2
FILESYSTEM_DISK=r2

# R2 Credentials (from Step 3)
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_DEFAULT_REGION=auto
R2_BUCKET=mboa-events-237
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_USE_PATH_STYLE_ENDPOINT=false

# Optional: Custom URL for accessing files
# If you want to use a custom domain (recommended for production)
R2_URL=https://cdn.yourdomain.com
```

#### 5.2 Verify Configuration

Check that your `config/filesystems.php` has the R2 disk configured:

```php
'r2' => [
    'driver' => 's3',
    'key' => env('R2_ACCESS_KEY_ID'),
    'secret' => env('R2_SECRET_ACCESS_KEY'),
    'region' => env('R2_DEFAULT_REGION', 'auto'),
    'bucket' => env('R2_BUCKET'),
    'url' => env('R2_URL'),
    'endpoint' => env('R2_ENDPOINT'),
    'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
    'visibility' => 'public',
    'throw' => false,
],
```

✅ **Done:** Laravel is configured to use R2

---

### Step 6: Install Required PHP Package

Laravel uses the AWS SDK for S3-compatible storage. You need to ensure it's installed:

```bash
# Run this in your Backend directory
cd Backend
composer require league/flysystem-aws-s3-v3
```

If already installed, update it:
```bash
composer update league/flysystem-aws-s3-v3
```

✅ **Done:** AWS SDK is installed

---

### Step 7: Test the Configuration

#### 7.1 Create a test route

Add this to your `routes/api.php` temporarily:

```php
use Illuminate\Support\Facades\Storage;

Route::get('/test-r2', function () {
    try {
        // Test connection by listing files (should be empty initially)
        $files = Storage::disk('r2')->files();
        
        return response()->json([
            'success' => true,
            'message' => 'R2 connection successful!',
            'files' => $files,
            'disk' => Storage::disk('r2')->getDriver()->getAdapter()->getClient()->getEndpoint(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'R2 connection failed!',
            'error' => $e->getMessage(),
        ], 500);
    }
});
```

#### 7.2 Test the connection

```bash
# Start your Laravel server
php artisan serve

# Then visit in your browser:
# http://localhost:8000/api/test-r2
```

**Expected response:**
```json
{
    "success": true,
    "message": "R2 connection successful!",
    "files": [],
    "disk": "https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
}
```

If you get an error, check:
- ✅ All .env variables are set correctly
- ✅ No typos in credentials
- ✅ Account ID in endpoint is correct
- ✅ Bucket name matches exactly

✅ **Done:** R2 is connected and working

---

### Step 8: Migrate Existing Files (If Applicable)

If you have existing files in local storage or another provider:

```bash
# Run the migration command (already exists in your codebase)
php artisan storage:migrate-s3
```

This will copy all files from your `local-uploads` disk to the `public` disk (which is now R2).

✅ **Done:** Files are migrated

---

### Step 9: Update ImageStorage Class (Optional but Recommended)

Update `app/Support/ImageStorage.php` to use R2:

```php
<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageStorage
{
    // Change from 'public' to 'r2'
    public const DISK = 'r2';

    /**
     * Store an uploaded image in the given directory on the R2 disk.
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, self::DISK);
    }

    /**
     * Delete a stored image, ignoring empty paths and externally hosted URLs.
     */
    public static function delete(?string $path): void
    {
        if ($path && ! self::isExternal($path)) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    /**
     * Store a new image and delete the previous one.
     */
    public static function replace(?UploadedFile $file, string $directory, ?string $currentPath): ?string
    {
        if (! $file) {
            return $currentPath;
        }

        self::delete($currentPath);

        return self::store($file, $directory);
    }

    /**
     * Determine whether a path points at an externally hosted image.
     */
    public static function isExternal(?string $path): bool
    {
        return is_string($path) && str_starts_with($path, 'http');
    }
}
```

✅ **Done:** Image storage now uses R2

---

### Step 10: Set Up Custom Domain (Recommended for Production)

#### 10.1 Create a CNAME record

1. Go to your **DNS provider** (where your domain is hosted)
2. Add a CNAME record:
   - **Name/Host:** `cdn` (or `static`, `assets`)
   - **Value/Target:** `YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`
   - **TTL:** Auto or 300

Example:
```
cdn.yourdomain.com → 1234567890abcdef.r2.cloudflarestorage.com
```

#### 10.2 Configure in Cloudflare

1. Go to **R2 → Your Bucket → Settings**
2. Find **"Custom Domains"** or **"Public Access"**
3. Add your custom domain: `cdn.yourdomain.com`
4. Cloudflare will verify the DNS record

#### 10.3 Update Laravel Configuration

In your `.env`:
```env
R2_URL=https://cdn.yourdomain.com
```

✅ **Done:** Custom domain is set up

---

### Step 11: Configure CORS (Cross-Origin Resource Sharing)

1. Go to **R2 → Your Bucket → Settings**
2. Find **"CORS"** configuration
3. Add a CORS rule:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com", "https://www.yourdomain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

Replace with your actual domains:
- `https://mboaevents237.com` (production)
- `http://localhost:5173` or `http://localhost:3000` (development)

✅ **Done:** CORS is configured

---

### Step 12: Set Up Lifecycle Rules (Optional but Recommended)

To automatically clean up old files:

1. Go to **R2 → Your Bucket → Settings**
2. Find **"Lifecycle Rules"**
3. Create a rule:
   - **Rule name:** `Cleanup old temporary files`
   - **Prefix:** `temp/`
   - **Expiration:** 30 days after creation
   - **Apply to:** All versions

✅ **Done:** Lifecycle rules configured

---

### Step 13: Test File Uploads

#### 13.1 Manual Test

1. Log in to your Mboa Events 237 platform
2. Create a new event with images
3. Upload a test image
4. Check that:
   - The upload succeeds
   - The image appears in your event
   - No errors in Laravel logs

#### 13.2 Check R2 Dashboard

1. Go to **R2 → Your Bucket**
2. Refresh the page
3. You should see your uploaded files in the `events/` directory

✅ **Done:** File uploads work correctly

---

### Step 14: Monitor Usage and Costs

1. **View usage:**
   - Go to **R2 → Overview**
   - See storage used, requests, and bandwidth

2. **Set up alerts (recommended):**
   - Go to **Notifications** in Cloudflare
   - Set up alerts for:
     - Storage usage > 80%
     - High number of failed requests
     - Unusual activity

3. **Cost estimation:**
   - R2 pricing: https://developers.cloudflare.com/r2/pricing/
   - **You only pay for:**
     - Storage: $0.015/GB/month
     - Requests: $0.0036/10,000 requests
     - **NO egress fees!**

✅ **Done:** Monitoring is set up

---

## 📋 Configuration Summary

### Required .env Variables

```env
FILESYSTEM_DISK=r2
R2_ACCESS_KEY_ID=your_key_here
R2_SECRET_ACCESS_KEY=your_secret_here
R2_DEFAULT_REGION=auto
R2_BUCKET=your_bucket_name
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_USE_PATH_STYLE_ENDPOINT=false
R2_URL=https://cdn.yourdomain.com  # Optional
```

### Files Modified

1. ✅ `.env` - Added R2 credentials
2. ✅ `config/filesystems.php` - Added R2 disk configuration
3. ✅ `app/Support/ImageStorage.php` - Updated to use R2
4. ✅ `composer.json` - AWS SDK installed

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Invalid access key"
- **Cause:** Wrong credentials or typo
- **Fix:** Double-check your `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`

#### Issue 2: "Bucket not found"
- **Cause:** Bucket name doesn't exist or typo
- **Fix:** Verify `R2_BUCKET` matches exactly (case-sensitive)

#### Issue 3: "Endpoint error"
- **Cause:** Wrong endpoint format
- **Fix:** Ensure endpoint is `https://ACCOUNT_ID.r2.cloudflarestorage.com`

#### Issue 4: "Connection timeout"
- **Cause:** Network/firewall issue
- **Fix:** Check your internet connection, try from different network

#### Issue 5: "403 Forbidden"
- **Cause:** Incorrect permissions on bucket
- **Fix:** Ensure your access key has read/write permissions

### Debug Commands

```bash
# Test R2 connection
php artisan tinker
>>> Storage::disk('r2')->files();

# Check configuration
php artisan config:show filesystem.disks.r2

# Clear config cache
php artisan config:clear
```

---

## 📊 Performance Optimization

### 1. Enable Cache Control Headers

In your Laravel code, when serving files:

```php
// Set cache headers for public files
Storage::disk('r2')->getDriver()->getAdapter()->getClient()
    ->putObject([
        'Bucket' => env('R2_BUCKET'),
        'Key' => $path,
        'Body' => $content,
        'CacheControl' => 'public, max-age=31536000, immutable', // 1 year cache
    ]);
```

### 2. Use Cloudflare Cache

R2 files automatically benefit from Cloudflare's global CDN. For maximum performance:

1. Go to **Caching → Configuration** in Cloudflare dashboard
2. Ensure **"Standard Caching"** is enabled for your domain

### 3. Image Optimization

Consider using Cloudflare's **Image Resizing** (separate from R2):
- Automatic WebP conversion
- Responsive images
- Quality optimization

---

## 🔄 Migration from Other Providers

### From Local Storage
```bash
php artisan storage:migrate-s3
```

### From AWS S3
1. Use `aws s3 sync` command:
```bash
aws s3 sync s3://old-bucket/ s3://mboa-events-237/ \
    --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com \
    --access-key R2_ACCESS_KEY_ID \
    --secret-key R2_SECRET_ACCESS_KEY
```

2. Or use Cloudflare's **R2 Batch** feature for large migrations

---

## 🎉 You're Done!

Your Mboa Events 237 platform is now using **Cloudflare R2** for storage:

- ✅ **Cost-effective:** No egress fees = huge savings
- ✅ **Fast:** Global CDN built-in
- ✅ **Reliable:** Cloudflare's world-class infrastructure
- ✅ **Scalable:** Handles growth seamlessly
- ✅ **Simple:** S3-compatible API = easy integration

**Next steps:**
1. Monitor your R2 usage in Cloudflare dashboard
2. Set up billing alerts (optional but recommended)
3. Consider setting up a custom domain for cleaner URLs
4. Test thoroughly before deploying to production

---

## 📚 Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Laravel Filesystem Documentation](https://laravel.com/docs/filesystem)
- [AWS SDK for PHP](https://docs.aws.amazon.com/aws-sdk-php/v3/api/index.html)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)

---

*Last updated: August 2, 2026*
*For: Mboa Events 237 Platform*
