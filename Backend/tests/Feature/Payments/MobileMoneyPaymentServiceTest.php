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

    public function test_apply_provider_status_marks_paid_and_confirms_registration(): void
    {
        $registration = $this->makeRegistration();
        $payment = $this->makePayment(['provider' => 'campay'], $registration);

        $result = (new MobileMoneyPaymentService)->applyProviderStatus($payment, [
            'status' => 'SUCCESSFUL',
        ]);

        $this->assertSame('paid', $result->status);
        $this->assertNotNull($result->paid_at);
        $this->assertSame('confirmed', $registration->fresh()->status);
        $this->assertSame('SUCCESSFUL', $result->metadata['last_provider_status']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'payment.status.updated']);
    }

    public function test_apply_provider_status_marks_failed_and_flags_registration(): void
    {
        $registration = $this->makeRegistration();
        $payment = $this->makePayment(['provider' => 'campay'], $registration);

        $result = (new MobileMoneyPaymentService)->applyProviderStatus($payment, [
            'status' => 'FAILED',
            'message' => 'Insufficient funds.',
        ]);

        $this->assertSame('failed', $result->status);
        $this->assertNull($result->paid_at);
        $this->assertSame('Insufficient funds.', $result->failure_reason);
        $this->assertSame('payment_failed', $registration->fresh()->status);
    }

    public function test_refresh_status_returns_payment_untouched_for_non_campay_provider(): void
    {
        $payment = $this->makePayment(['provider' => 'mock', 'status' => 'processing']);

        $result = (new MobileMoneyPaymentService)->refreshStatus($payment);

        $this->assertSame('processing', $result->status);
        $this->assertSame('mock', $result->provider);
    }
}
