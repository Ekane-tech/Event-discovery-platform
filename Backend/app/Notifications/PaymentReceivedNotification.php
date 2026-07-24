<?php

namespace App\Notifications;

use App\Models\Payment;
use App\Notifications\Concerns\UsesNotificationPreferences;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable, UsesNotificationPreferences;

    public function __construct(public Payment $payment)
    {
    }

    // Transactional — always send.
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $event = $this->payment->event;

        return (new MailMessage)
            ->subject('Payment received: '.$event?->title)
            ->greeting('Hi '.$notifiable->name.',')
            ->line('We received your payment for "'.$event?->title.'".')
            ->line('**Amount:** '.number_format($this->payment->amount, 0).' XAF')
            ->line('**Reference:** '.$this->payment->reference)
            ->line('**Status:** Paid')
            ->action('View your ticket', $this->frontendUrl('/tickets/'.$event?->id))
            ->line('Your registration is now confirmed. See you at the event!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Payment received',
            'message' => 'Your payment of '.number_format($this->payment->amount, 0).' XAF for "'.$this->payment->event?->title.'" was received. Your registration is confirmed.',
            'event_id' => $this->payment->event_id,
            'event_title' => $this->payment->event?->title,
            'amount' => $this->payment->amount,
            'reference' => $this->payment->reference,
            'notification_kind' => 'payment_received',
        ];
    }
}
