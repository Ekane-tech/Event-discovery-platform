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
    public function test_map_mesomb_status_returns_paid_for_success_values(string $status): void
    {
        $this->assertSame('paid', $this->invokePrivate('mapMeSombStatus', [$status]));
    }

    public static function successStatusProvider(): array
    {
        return [
            ['SUCCESS'],
            ['success'],
            ['succeeded'],
            ['SUCCESSFUL'],
            ['Completed'],
            ['paid'],
        ];
    }

    /**
     * @dataProvider failureStatusProvider
     */
    public function test_map_mesomb_status_returns_failed_for_failure_values(string $status): void
    {
        $this->assertSame('failed', $this->invokePrivate('mapMeSombStatus', [$status]));
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

    /**
     * @dataProvider pendingStatusProvider
     */
    public function test_map_mesomb_status_returns_processing_for_pending_values(string $status): void
    {
        $this->assertSame('processing', $this->invokePrivate('mapMeSombStatus', [$status]));
    }

    public static function pendingStatusProvider(): array
    {
        return [
            ['PENDING'],
            ['pending'],
            ['PROCESSING'],
        ];
    }

    public function test_map_mesomb_status_returns_null_for_unknown_values(): void
    {
        $this->assertNull($this->invokePrivate('mapMeSombStatus', ['WEIRD']));
        $this->assertNull($this->invokePrivate('mapMeSombStatus', [null]));
    }

    /**
     * @dataProvider payerProvider
     */
    public function test_mesomb_payer_strips_country_code_and_non_digits(string $input, string $expected): void
    {
        $this->assertSame($expected, $this->invokePrivate('mesombPayer', [$input]));
    }

    public static function payerProvider(): array
    {
        return [
            ['+237 6 77 12 34 56', '677123456'],
            ['(237)677-123-456', '677123456'],
            ['677123456', '677123456'],
            ['+237677123456', '677123456'],
        ];
    }

    /**
     * @dataProvider phoneProvider
     */
    public function test_normalize_cameroon_phone_returns_plus_237_format(string $input, string $expected): void
    {
        $this->assertSame($expected, $this->invokePrivate('normalizeCameroonPhone', [$input]));
    }

    public static function phoneProvider(): array
    {
        return [
            ['+237 6 77 12 34 56', '+237677123456'],
            ['677123456', '+237677123456'],
            ['+237677123456', '+237677123456'],
        ];
    }

    /**
     * @dataProvider serviceProvider
     */
    public function test_mesomb_service_maps_operator(string $input, string $expected): void
    {
        $this->assertSame($expected, $this->invokePrivate('mesombService', [$input]));
    }

    public static function serviceProvider(): array
    {
        return [
            ['mtn', 'MTN'],
            ['MTN', 'MTN'],
            ['orange', 'ORANGE'],
            ['Orange', 'ORANGE'],
            ['unknown', 'MTN'],
        ];
    }
}
