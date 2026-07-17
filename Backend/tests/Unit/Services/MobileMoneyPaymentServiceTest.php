<?php

namespace Tests\Unit\Services;

use App\Services\Payments\MobileMoneyPaymentService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class MobileMoneyPaymentServiceTest extends TestCase
{
    private function invokePrivate(string $method, array $args): mixed
    {
        $reflection = new ReflectionMethod(MobileMoneyPaymentService::class, $method);
        $reflection->setAccessible(true);

        return $reflection->invokeArgs(new MobileMoneyPaymentService, $args);
    }

    /**
     * @dataProvider successStatusProvider
     */
    public function test_map_campay_status_returns_paid_for_success_values(string $status): void
    {
        $this->assertSame('paid', $this->invokePrivate('mapCampayStatus', [$status]));
    }

    public static function successStatusProvider(): array
    {
        return [
            ['SUCCESSFUL'],
            ['success'],
            ['Completed'],
            ['paid'],
        ];
    }

    /**
     * @dataProvider failureStatusProvider
     */
    public function test_map_campay_status_returns_failed_for_failure_values(string $status): void
    {
        $this->assertSame('failed', $this->invokePrivate('mapCampayStatus', [$status]));
    }

    public static function failureStatusProvider(): array
    {
        return [
            ['FAILED'],
            ['failure'],
            ['CANCELLED'],
            ['canceled'],
            ['EXPIRED'],
        ];
    }

    public function test_map_campay_status_falls_back_based_on_request_acceptance(): void
    {
        $this->assertSame('processing', $this->invokePrivate('mapCampayStatus', ['PENDING', true]));
        $this->assertSame('failed', $this->invokePrivate('mapCampayStatus', ['PENDING', false]));
        $this->assertSame('failed', $this->invokePrivate('mapCampayStatus', [null]));
    }

    /**
     * @dataProvider phoneProvider
     */
    public function test_campay_phone_strips_non_digits_and_leading_plus(string $input, string $expected): void
    {
        $this->assertSame($expected, $this->invokePrivate('campayPhone', [$input]));
    }

    public static function phoneProvider(): array
    {
        return [
            ['+237 6 77 12 34 56', '237677123456'],
            ['(237)677-123-456', '237677123456'],
            ['677123456', '677123456'],
            ['+237677123456', '237677123456'],
        ];
    }

    public function test_campay_base_url_uses_explicit_override(): void
    {
        putenv('CAMPAY_BASE_URL=https://custom.example.com/');
        putenv('CAMPAY_ENV');

        try {
            $this->assertSame('https://custom.example.com', $this->invokePrivate('campayBaseUrl', []));
        } finally {
            putenv('CAMPAY_BASE_URL');
        }
    }

    public function test_campay_base_url_switches_on_environment(): void
    {
        putenv('CAMPAY_BASE_URL');

        putenv('CAMPAY_ENV=PROD');
        $this->assertSame('https://www.campay.net', $this->invokePrivate('campayBaseUrl', []));

        putenv('CAMPAY_ENV=DEV');
        $this->assertSame('https://demo.campay.net', $this->invokePrivate('campayBaseUrl', []));

        putenv('CAMPAY_ENV');
        $this->assertSame('https://demo.campay.net', $this->invokePrivate('campayBaseUrl', []));
    }
}
