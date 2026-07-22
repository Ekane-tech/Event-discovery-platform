<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = true;

    protected $fillable = ['key', 'value'];

    /**
     * Read a setting with a fallback default.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::find($key);

        if (! $setting) {
            return $default;
        }

        return $setting->value;
    }

    public static function getFloat(string $key, float $default = 0.0): float
    {
        return (float) static::get($key, (string) $default);
    }

    public static function getInt(string $key, int $default = 0): int
    {
        return (int) static::get($key, (string) $default);
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => (string) $value]);
    }
}
