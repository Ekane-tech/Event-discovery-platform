<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RegistrationResource;
use App\Models\Event;
use App\Models\EventTicketType;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $registrations = Registration::query()
            ->where('user_id', $request->user()->id)
            ->with(['event.organizer.role', 'event.organizer.profile', 'event.category', 'event.region', 'event.division', 'event.city', 'event.images', 'payment', 'ticketType', 'checkedInBy.role', 'checkedInBy.profile'])
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
                $registration->load(['event.organizer.role', 'event.organizer.profile', 'event.category', 'event.region', 'event.division', 'event.city', 'event.images', 'payment', 'ticketType', 'checkedInBy.role', 'checkedInBy.profile'])
            ),
        ]);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $this->ensureEventCanBeRegistered($event);

        $validated = $request->validate([
            'ticket_type_id' => ['nullable', 'integer', 'exists:event_ticket_types,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $quantity = (int) ($validated['quantity'] ?? 1);
        $ticketType = $this->resolveTicketType($event, $validated['ticket_type_id'] ?? null);
        $ticketPrice = $ticketType ? (float) $ticketType->price : (float) $event->price;
        $totalPrice = $ticketPrice * $quantity;

        $this->ensureCapacityIsAvailable($event, $quantity);
        $this->ensureTicketTypeCapacityIsAvailable($ticketType, $quantity);

        $pendingRegistration = Registration::query()
            ->where('user_id', $request->user()->id)
            ->where('event_id', $event->id)
            ->where('status', 'pending_payment')
            ->latest()
            ->first();

        if ($pendingRegistration) {
            return response()->json([
                'message' => 'You already have a pending payment for this event.',
                'registration' => new RegistrationResource(
                    $pendingRegistration->load(['event.organizer.role', 'event.organizer.profile', 'event.category', 'event.region', 'event.division', 'event.city', 'event.images', 'payment', 'ticketType', 'checkedInBy.role', 'checkedInBy.profile'])
                ),
            ], 202);
        }

        $isPaidEvent = $totalPrice > 0;
        $payment = null;

        [$primaryRegistration, $registrationIds] = DB::transaction(function () use ($request, $event, $ticketType, $quantity, $isPaidEvent, $totalPrice, &$payment) {
            $registrationIds = collect();

            for ($index = 0; $index < $quantity; $index++) {
                $registration = Registration::create([
                    'user_id' => $request->user()->id,
                    'event_id' => $event->id,
                    'ticket_type_id' => $ticketType?->id,
                    'status' => $isPaidEvent ? 'pending_payment' : 'confirmed',
                    'ticket_number' => $this->generateTicketNumber($event),
                    'registered_at' => now(),
                ]);
                $registrationIds->push($registration->id);
            }

            $primaryRegistration = Registration::find($registrationIds->first());

            if ($isPaidEvent) {
                $payment = Payment::create([
                    'user_id' => $request->user()->id,
                    'event_id' => $event->id,
                    'registration_id' => $primaryRegistration->id,
                    'amount' => $totalPrice,
                    'currency' => 'XAF',
                    'status' => 'pending',
                    'provider' => env('PAYMENT_PROVIDER', 'mock'),
                    'reference' => $this->generatePaymentReference($event),
                    'metadata' => [
                        'registration_attempt_id' => $primaryRegistration->id,
                        'registration_ids' => $registrationIds->values()->all(),
                        'quantity' => $quantity,
                        'unit_price' => $totalPrice / $quantity,
                        'ticket_type_id' => $ticketType?->id,
                        'ticket_type_name' => $ticketType?->name,
                    ],
                ]);
            }

            return [$primaryRegistration, $registrationIds];
        });

        $registrations = Registration::whereIn('id', $registrationIds)->get()->load(['ticketType']);

        return response()->json([
            'message' => $isPaidEvent ? 'Payment is required to complete this registration.' : 'Registered for event successfully.',
            'payment_required' => $isPaidEvent,
            'quantity' => $quantity,
            'registration' => new RegistrationResource(
                $primaryRegistration->fresh()->load(['event.organizer.role', 'event.organizer.profile', 'event.category', 'event.region', 'event.division', 'event.city', 'event.images', 'payment', 'ticketType', 'checkedInBy.role', 'checkedInBy.profile'])
            ),
            'registrations' => RegistrationResource::collection($registrations),
            'payment' => $payment ? new \App\Http\Resources\PaymentResource($payment->load(['event', 'registration'])) : null,
        ], $isPaidEvent ? 202 : 201);
    }

    public function verifyTicket(string $ticketNumber): JsonResponse
    {
        $registration = Registration::query()
            ->where('ticket_number', $ticketNumber)
            ->with(['event.organizer.role', 'event.organizer.profile', 'event.category', 'event.region', 'event.division', 'event.city', 'event.images', 'user.profile', 'ticketType', 'checkedInBy.profile'])
            ->first();

        if (! $registration) {
            return response()->json([
                'valid' => false,
                'message' => 'Ticket not found.',
            ], 404);
        }

        $event = $registration->event;
        $eventIsAvailable = $event
            && $event->status === 'published'
            && $event->visibility === 'public';

        $registrationIsValid = $registration->status === 'confirmed' && $eventIsAvailable;

        return response()->json([
            'valid' => $registrationIsValid,
            'message' => $registrationIsValid
                ? 'Ticket is valid.'
                : 'Ticket is not currently valid.',
            'ticket' => [
                'registration_id' => $registration->id,
                'ticket_number' => $registration->ticket_number,
                'status' => $registration->status,
                'ticket_type' => $registration->ticketType ? [
                    'id' => $registration->ticketType->id,
                    'name' => $registration->ticketType->name,
                    'price' => $registration->ticketType->price,
                ] : null,
                'registered_at' => $registration->registered_at,
                'checked_in_at' => $registration->checked_in_at,
                'checked_in_by' => $registration->checkedInBy?->name,
                'attendee' => [
                    'name' => $registration->user?->name,
                    'email' => $registration->user?->email,
                    'city' => $registration->user?->profile?->city,
                ],
                'event' => $event ? [
                    'id' => $event->id,
                    'title' => $event->title,
                    'status' => $event->status,
                    'visibility' => $event->visibility,
                    'start_date' => $event->start_date,
                    'venue' => $event->venue,
                    'city' => $event->city?->name,
                    'region' => $event->region?->name,
                    'category' => $event->category?->name,
                    'organizer' => $event->organizer?->name,
                ] : null,
            ],
        ]);
    }


    public function checkIn(Request $request, Registration $registration): JsonResponse
    {
        $registration->load(['event', 'user.profile', 'checkedInBy.role', 'checkedInBy.profile']);
        $event = $registration->event;
        $user = $request->user();

        if (! $user->hasRole('admin') && ! ($user->hasRole('organizer') && (int) $event->organizer_id === (int) $user->id)) {
            abort(403, 'You do not have permission to check in attendees for this event.');
        }

        if ($registration->status !== 'confirmed') {
            return response()->json([
                'message' => 'Only confirmed registrations can be checked in.',
                'registration' => new RegistrationResource($registration),
            ], 422);
        }

        if ($registration->checked_in_at) {
            return response()->json([
                'message' => 'Attendee is already checked in.',
                'registration' => new RegistrationResource($registration),
            ]);
        }

        $registration->update([
            'checked_in_at' => now(),
            'checked_in_by' => $user->id,
        ]);

        AuditLog::record($user, 'attendee.checked_in', $registration, 'Attendee checked in.', [
            'event_id' => $event->id,
            'ticket_number' => $registration->ticket_number,
        ]);

        return response()->json([
            'message' => 'Attendee checked in successfully.',
            'registration' => new RegistrationResource($registration->fresh()->load(['event', 'user.profile', 'checkedInBy.role', 'checkedInBy.profile'])),
        ]);
    }

    public function destroy(Request $request, Event $event): JsonResponse
    {
        $registration = Registration::query()
            ->where('user_id', $request->user()->id)
            ->where('event_id', $event->id)
            ->where('status', 'confirmed')
            ->latest()
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

        $registration->update(['status' => 'cancelled_by_user']);

        return response()->json([
            'message' => 'Event registration cancelled successfully.',
            'status' => $registration->status,
        ]);
    }


    private function resolveTicketType(Event $event, ?int $ticketTypeId): ?EventTicketType
    {
        $query = $event->ticketTypes()->where('is_active', true);

        if ($ticketTypeId) {
            return (clone $query)->whereKey($ticketTypeId)->firstOrFail();
        }

        return $query->orderBy('sort_order')->orderBy('price')->first();
    }

    private function ensureTicketTypeCapacityIsAvailable(?EventTicketType $ticketType, int $requestedQuantity = 1): void
    {
        if (! $ticketType || ! $ticketType->quantity) {
            return;
        }

        $reservedRegistrations = $ticketType->registrations()
            ->whereIn('status', ['confirmed', 'pending_payment'])
            ->count();

        if ($reservedRegistrations + $requestedQuantity > $ticketType->quantity) {
            abort(422, 'This ticket type does not have enough remaining tickets.');
        }
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

    private function ensureCapacityIsAvailable(Event $event, int $requestedQuantity = 1): void
    {
        if (! $event->maximum_participants) {
            return;
        }

        $confirmedRegistrations = $event->registrations()->whereIn('status', ['confirmed', 'pending_payment'])->count();

        if ($confirmedRegistrations + $requestedQuantity > $event->maximum_participants) {
            abort(422, 'This event does not have enough remaining places.');
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
