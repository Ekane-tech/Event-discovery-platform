<?php

namespace Tests\Feature\Payments;

use App\Models\Event;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use App\Services\Payments\MobileMoneyPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MobileMoneyPaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    private function makePayment(array $overrides = [], ?Registration $registration = null): Payment
    {
        $user = User::factory()->create();
        $event = Event::create([
            'organizer_id' => $user->id,
            'title' => 'Paid Event '.Str::random(5),
            'description' => 'Description.',
            'start_date' => now()->addWeek(),
            'price' => 5000,
        ]);

        return Payment::create(array_merge([
            'user_id' => $user->id,
            'event_id' => $event->id,
            'registration_id' => $registration?->id,
            'amount' => 5000,
            'currency' => 'XAF',
            'status' => 'pending',
            'reference' => 'REF-'.Str::upper(Str::random(10)),
        ], $overrides));
    }

    private function makeRegistration(): Registration
    {
        $user = User::factory()->create();
        $event = Event::create([
            'organizer_id' => $user->id,
            'title' => 'Registration Event '.Str::random(5),
            'description' => 'Description.',
            'start_date' => now()->addWeek(),
        ]);

        return Registration::create([
            'user_id' => $user->id,
            'event_id' => $event->id,
            'status' => 'pending_payment',
            'ticket_number' => 'TICKET-'.Str::upper(Str::random(8)),
        ]);
    }

    public function test_initiate_uses_mock_provider_and_marks_payment_processing(): void
    {
        $payment = $this->makePayment();

        $result = (new MobileMoneyPaymentService)->initiate($payment, 'MTN', '+237677123456');

        $this->assertSame('mock', $result->provider);
        $this->assertSame('processing', $result->status);
        $this->assertSame('MTN', $result->operator);
        $this->assertSame('+237677123456', $result->phone_number);
        $this->assertStringStartsWith('MOCK-', $result->external_reference);
        $this->assertNotNull($result->initiated_at);
        $this->assertSame('development', $result->metadata['provider_mode']);

        $this->assertDatabaseHas('audit_logs', ['action' => 'payment.initiated']);
    }

    public function test_apply_provider_status_marks_paid_and_confirms_registration_with_webhook_payload(): void
    {
        $registration = $this->makeRegistration();
        $payment = $this->makePayment(['provider' => 'mesomb'], $registration);

        // MeSomb webhook payload shape (data.object carries the transaction).
        $result = (new MobileMoneyPaymentService)->applyProviderStatus($payment, [
            'id' => 'evt_123',
            'type' => 'payment.transaction.succeeded',
            'data' => [
                'object' => [
                    'pk' => '4af43191-2f37-4a16-8471-4e8e40c314af',
                    'status' => 'SUCCESS',
                    'message' => 'Payment completed.',
                ],
            ],
        ]);

        $this->assertSame('paid', $result->status);
        $this->assertNotNull($result->paid_at);
        $this->assertSame('confirmed', $registration->fresh()->status);
        $this->assertSame('SUCCESS', $result->metadata['last_provider_status']);
        $this->assertSame('4af43191-2f37-4a16-8471-4e8e40c314af', $result->provider_reference);
        $this->assertDatabaseHas('audit_logs', ['action' => 'payment.status.updated']);
    }

    public function test_apply_provider_status_marks_paid_from_new_style_webhook_status(): void
    {
        $registration = $this->makeRegistration();
        $payment = $this->makePayment(['provider' => 'mesomb'], $registration);

        // Newer MeSomb webhook format uses lowercase statuses + object id.
        $result = (new MobileMoneyPaymentService)->applyProviderStatus($payment, [
            'id' => 'evt_456',
            'event_type' => 'payment.transaction.succeeded',
            'data' => [
                'object' => [
                    'id' => 'txn_01HX9K7A1R6F8MZK2Q9V7N4P5B',
                    'status' => 'succeeded',
                    'reference' => 'REF-TEST',
                ],
            ],
        ]);

        $this->assertSame('paid', $result->status);
        $this->assertSame('confirmed', $registration->fresh()->status);
    }

    public function test_apply_provider_status_marks_failed_and_flags_registration(): void
    {
        $registration = $this->makeRegistration();
        $payment = $this->makePayment(['provider' => 'mesomb'], $registration);

        $result = (new MobileMoneyPaymentService)->applyProviderStatus($payment, [
            'type' => 'payment.transaction.failed',
            'data' => [
                'object' => [
                    'status' => 'FAILED',
                    'message' => 'Insufficient funds.',
                ],
            ],
        ]);

        $this->assertSame('failed', $result->status);
        $this->assertNull($result->paid_at);
        $this->assertSame('Insufficient funds.', $result->failure_reason);
        $this->assertSame('payment_failed', $registration->fresh()->status);
    }

    public function test_apply_provider_status_with_pending_keeps_payment_processing(): void
    {
        $payment = $this->makePayment(['provider' => 'mesomb', 'status' => 'processing']);

        $result = (new MobileMoneyPaymentService)->applyProviderStatus($payment, [
            'success' => true,
            'status' => 'PENDING',
            'transaction' => [
                'pk' => '123e4567-e89b-12d3-a456-426614174000',
                'status' => 'PENDING',
            ],
        ]);

        $this->assertSame('processing', $result->status);
        $this->assertNull($result->paid_at);
        $this->assertSame('123e4567-e89b-12d3-a456-426614174000', $result->provider_reference);
    }

    public function test_apply_provider_status_does_not_downgrade_paid_payment(): void
    {
        $registration = $this->makeRegistration();
        $payment = $this->makePayment([
            'provider' => 'mesomb',
            'status' => 'paid',
            'paid_at' => now()->subHour(),
        ], $registration);

        $result = (new MobileMoneyPaymentService)->applyProviderStatus($payment, [
            'type' => 'payment.transaction.failed',
            'data' => ['object' => ['status' => 'FAILED']],
        ]);

        $this->assertSame('paid', $result->status);
        $this->assertSame('confirmed', $registration->fresh()->status);
    }

    public function test_refresh_status_returns_payment_untouched_for_non_mesomb_provider(): void
    {
        $payment = $this->makePayment(['provider' => 'mock', 'status' => 'processing']);

        $result = (new MobileMoneyPaymentService)->refreshStatus($payment);

        $this->assertSame('processing', $result->status);
        $this->assertSame('mock', $result->provider);
    }
}
