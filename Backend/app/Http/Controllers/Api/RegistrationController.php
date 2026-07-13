<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\RegistrationResource;
use App\Models\Event;
use App\Models\Payment;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $registrations = Registration::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'event.organizer.role',
                'event.organizer.profile',
                'event.category',
                'event.region',
                'event.division',
                'event.city',
                'event.images',
                'payment',
            ])
            ->latest()
            ->paginate(min((int) $request->input('per_page', 12), 50));

        return response()->json([
            'registrations' => RegistrationResource::collection($registrations),
        ]);
    }

    public function show(Request $request, Registration $registration): JsonResponse
    {
        if ((int) $registration->user_id !== (int) $request->user()->id) {
            abort(403, 'You do not have permission to view this registration.');
        }

        return response()->json([
            'registration' => new RegistrationResource(
                $registration->load([
                    'event.organizer.role',
                    'event.organizer.profile',
                    'event.category',
                    'event.region',
                    'event.division',
                    'event.city',
                    'event.images',
                    'payment',
                ])
            ),
        ]);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $this->ensureEventCanBeRegistered($event);
        $this->ensureCapacityIsAvailable($event);

        $registration = Registration::query()
            ->where('user_id', $request->user()->id)
            ->where('event_id', $event->id)
            ->first();

        if ($registration && $registration->status === 'confirmed') {
            return response()->json([
                'message' => 'You are already registered for this event.',
                'payment_required' => false,
                'registration' => new RegistrationResource(
                    $registration->load([
                        'event.organizer.role',
                        'event.organizer.profile',
                        'event.category',
                        'event.region',
                        'event.division',
                        'event.city',
                        'event.images',
                        'payment',
                    ])
                ),
                'payment' => null,
            ]);
        }

        $isPaidEvent = (float) $event->price > 0;

        if (! $registration) {
            $registration = Registration::create([
                'user_id' => $request->user()->id,
                'event_id' => $event->id,
                'status' => $isPaidEvent ? 'pending_payment' : 'confirmed',
                'ticket_number' => $this->generateTicketNumber($event),
                'registered_at' => now(),
            ]);
        } else {
            $registration->update([
                'status' => $isPaidEvent ? 'pending_payment' : 'confirmed',
                'ticket_number' => $this->generateTicketNumber($event),
                'registered_at' => now(),
            ]);
        }

        $payment = null;

        if ($isPaidEvent) {
            $payment = Payment::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'event_id' => $event->id,
                    'registration_id' => $registration->id,
                    'status' => 'pending',
                ],
                [
                    'amount' => $event->price,
                    'currency' => 'XAF',
                    'provider' => 'mock',
                    'reference' => $this->generatePaymentReference($event),
                    'metadata' => [
                        'mode' => 'mock_payment',
                    ],
                ]
            );
        }

        return response()->json([
            'message' => $isPaidEvent
                ? 'Payment is required to complete this registration.'
                : 'Registered for event successfully.',
            'payment_required' => $isPaidEvent,
            'registration' => new RegistrationResource(
                $registration->fresh()->load([
                    'event.organizer.role',
                    'event.organizer.profile',
                    'event.category',
                    'event.region',
                    'event.division',
                    'event.city',
                    'event.images',
                    'payment',
                ])
            ),
            'payment' => $payment ? new PaymentResource(
                $payment->load(['event', 'registration'])
            ) : null,
        ], $isPaidEvent ? 202 : 201);
    }

    public function destroy(Request $request, Event $event): JsonResponse
    {
        $registration = Registration::query()
            ->where('user_id', $request->user()->id)
            ->where('event_id', $event->id)
            ->first();

        if (! $registration) {
            return response()->json([
                'message' => 'No registration found for this event.',
            ], 404);
        }

        if ($registration->status !== 'confirmed') {
            return response()->json([
                'message' => 'This registration can no longer be cancelled.',
                'status' => $registration->status,
            ], 422);
        }

        if ($event->status !== 'published' || $event->visibility !== 'public') {
            return response()->json([
                'message' => 'This event is no longer available. The registration has already been handled by the system.',
                'status' => $registration->status,
            ], 422);
        }

        $registration->update([
            'status' => 'cancelled_by_user',
        ]);

        return response()->json([
            'message' => 'Event registration cancelled successfully.',
            'status' => $registration->status,
        ]);
    }

    private function ensureEventCanBeRegistered(Event $event): void
    {
        if ($event->status !== 'published' || $event->visibility !== 'public') {
            abort(422, 'Only published public events can be registered for.');
        }

        if ($event->registration_deadline && now()->greaterThan($event->registration_deadline)) {
            abort(422, 'Registration deadline has passed.');
        }

        if ($event->start_date && now()->greaterThan($event->start_date)) {
            abort(422, 'This event has already started.');
        }
    }

    private function ensureCapacityIsAvailable(Event $event): void
    {
        if (! $event->maximum_participants) {
            return;
        }

        $confirmedRegistrations = $event->registrations()
            ->where('status', 'confirmed')
            ->count();

        if ($confirmedRegistrations >= $event->maximum_participants) {
            abort(422, 'This event is already full.');
        }
    }

    private function generatePaymentReference(Event $event): string
    {
        do {
            $reference = 'PAY-EVT-'.$event->id.'-'.Str::upper(Str::random(10));
        } while (Payment::where('reference', $reference)->exists());

        return $reference;
    }

    private function generateTicketNumber(Event $event): string
    {
        do {
            $ticketNumber = 'CM-EVT-'.$event->id.'-'.Str::upper(Str::random(8));
        } while (Registration::where('ticket_number', $ticketNumber)->exists());

        return $ticketNumber;
    }
}