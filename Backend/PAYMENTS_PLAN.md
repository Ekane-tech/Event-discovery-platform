# NotchPay Payment Integration — Mboa Events 237

This document is the **design plan** for the changes being made to the
payment integration on the `arena/019fc801-event-discovery-platform`
branch. Read this BEFORE merging anything to `staging`.

If anything in this plan looks wrong, **stop and ask** before
touching code. Once the plan is approved, code changes go in as
**one commit** at the end.

---

## 1. What problem we're solving

The current payment flow has three issues:

### Issue 1 — User waits too long after clicking "Pay"

When the user clicks "Pay with MTN" in the frontend, the browser
sends `POST /api/payments/{id}/initiate`. The backend then:

1. Calls NotchPay `POST /payments` (creates the payment object) — ~2s
2. Calls NotchPay `POST /payments/{ref}` with channel `cm.mtn` — **5 to 30 seconds**, blocking the request

The browser shows a spinner for the whole 5-30 seconds. If MTN's
network is slow, it can be even longer. Users think it's broken and
close the tab.

**The NotchPay charge API is inherently synchronous** — it waits for
the user to confirm the prompt on their phone. So we cannot make
this single HTTP call return faster.

**Our fix:** do step 1 in the HTTP request (fast), and do step 2 in
a background queue job. The browser gets an instant "Check your
phone" message. The job runs in the worker.

### Issue 2 — Webhook signature is wrong

The current code checks `X-Notchpay-Signature`. The official
NotchPay header is `X-Notch-Signature`. Every real webhook in
production would currently be rejected as "invalid signature".

### Issue 3 — Webhook status field is read from the wrong place

NotchPay's webhook payload looks like:

```json
{
  "type": "payment.complete",
  "data": {
    "id": "...",
    "reference": "...",
    "transaction": { "status": "complete" }
  }
}
```

Our current code looks for `payload['status']` first (which is
absent) and then falls back to `payload['transaction']['status']`
(which doesn't exist at the root). It would never find the actual
status and would always treat webhooks as "failed".

---

## 2. The new design

### 2.1 Initiate flow (what happens when user clicks Pay)

```
[Browser]                [Laravel API]              [Queue Worker]              [NotchPay]
    │                         │                          │                          │
    │  POST /payments/1/initiate                         │                          │
    │────────────────────────→│                          │                          │
    │                         │  POST /payments (init)   │                          │
    │                         │─────────────────────────────────────────────────→│
    │                         │←─────────────────────────────────────────────────│
    │                         │  ← 200, got reference                            │
    │                         │                                                  │
    │                         │  dispatch ProcessNotchPayChargeJob               │
    │                         │─────────────────────────→│                          │
    │←────────────────────────│  202 { status: "processing",                     │
    │   "Check your phone"    │     reference: "PAY-..." }                       │
    │                         │                          │  POST /payments/{ref}   │
    │                         │                          │  (channel: cm.mtn)      │
    │                         │                          │────────────────────────→│
    │                         │                          │← waits 5-30s ───────────│
    │                         │                          │←────────────────────────│
    │                         │                          │  save status             │
    │                         │                          │  (still processing)      │
    ▼                         ▼                          ▼                          ▼
[Browser shows             [Done in <1s]              [Runs in background]      [Webhook fires]
 "Check your phone"                                                                    │
 and confirm the prompt"                                                               │
                                                                                       ▼
                                                                          [Webhook hits our
                                                                           /payments/callback/
                                                                           notchpay endpoint]
```

When the user confirms on their phone (or cancels), NotchPay
delivers a webhook. That webhook is processed by a separate
`ProcessNotchPayWebhookJob` which updates the payment status and
sends the confirmation email.

### 2.2 Confirmation flow (webhook → email → DB)

```
[NotchPay webhook]              [API]                [Queue Worker]
        │                         │                          │
        │  POST /api/payments/callback/notchpay             │
        │  (X-Notch-Signature: <hmac>)                     │
        │────────────────────────→│                          │
        │                         │  verify signature        │
        │                         │  extract reference       │
        │                         │  dispatch ProcessNotchPayWebhookJob
        │                         │─────────────────────────→│
        │←────────────────────────│  200 OK                  │
        │   (sub-100ms response)  │                          │  find payment row
        │                         │                          │  apply status
        │                         │                          │  if paid:
        │                         │                          │    - mark registrations confirmed
        │                         │                          │    - fire PaymentReceivedNotification
        │                         │                          │  if failed:
        │                         │                          │    - mark registrations payment_failed
        │                         │                          │    - fire PaymentFailedNotification (new)
        ▼                         ▼                          ▼
```

### 2.3 Frontend (we're not changing it in this commit)

The frontend will receive a 202 with `status: "processing"`. Whatever
spinner/message it shows today will keep working — it just won't
spin for 30 seconds. We'll suggest frontend changes in a separate
commit (after you OK the backend).

---

## 3. Files that change

| File | What changes |
|---|---|
| `Backend/app/Services/Payments/MobileMoneyPaymentService.php` | Split `initiateNotchPay` into two methods: `initializeOnNotchPay` (fast, just creates the payment) and a new `chargeOnNotchPay` (the slow part, runs in background). Fix webhook payload parsing. Add `Idempotency-Key`. Add `notchpayChannel()` helper. Require valid email. |
| `Backend/app/Http/Controllers/Api/PaymentController.php` | `notchpayCallback()` no longer processes the webhook inline — it just verifies signature, extracts reference, dispatches the job, returns 200. Fix signature header. |
| `Backend/app/Jobs/ProcessNotchPayChargeJob.php` | **NEW.** Runs the slow charge API call in the background. 5 retries with exponential backoff. |
| `Backend/app/Jobs/ProcessNotchPayWebhookJob.php` | **NEW.** Async webhook handler. Idempotent (skips if payment already in terminal state). 5 retries. |
| `Backend/.env.example` | New env vars: `NOTCHPAY_INIT_TIMEOUT`, `NOTCHPAY_CHARGE_TIMEOUT`, `REDIS_QUEUE_RETRY_AFTER`. Documented. |
| `Backend/Procfile` | Worker `--timeout` raised from 90s to 130s (the charge job needs 90s, the webhook job needs ~10s, plus 30s headroom). |
| `Backend/routes/api.php` | Comment on why the webhook is not throttled. No code change (middleware was already removed in last commit). |

**No frontend changes in this commit.** The frontend will keep
working — the 202 response is what the controller returns today
anyway (just after a long wait instead of instantly).

---

## 4. Tradeoffs and risks

### Risk 1 — User closes the browser before confirming

If the user closes the tab after seeing "Check your phone" but
before approving the prompt on their phone, the payment never
completes. The registration stays in `pending_payment`.

**Mitigation:** the charge job retries 5 times with exponential
backoff (1s, 5s, 30s, 2m, 10m). If NotchPay still says
`processing` after 10 minutes, we mark it as `expired` and the
user can retry from the registrations page.

**Mitigation 2:** we add a `PaymentExpiredNotification` (new email
class) so the user gets a "your payment expired, click here to
retry" email after 10 minutes of being stuck in `processing`.

### Risk 2 — Queue worker is down

If the queue worker is crashed, no charge job runs and no webhook
job runs. All payments are stuck in `processing` forever.

**Mitigation:** add a monitoring endpoint
`GET /api/health/queue` that returns 200 if the worker has
processed a job in the last 60 seconds, 503 otherwise. Point
UptimeRobot at it.

**Mitigation 2:** the existing
`php artisan queue:work --tries=3 --timeout=90` in the Procfile
will be `--timeout=130` after this change. The charge job sets
`$timeout = 120` so it never exceeds the worker's timeout.

### Risk 3 — Webhook signature is still misconfigured

If `NOTCHPAY_WEBHOOK_SECRET` is not set on Railway, the webhook
endpoint will (in non-production) accept unsigned webhooks. In
production, it will reject them.

**Mitigation:** the deploy must include this env var. We document
this in `PAYMENTS_PLAN.md` (this file) and the README.

### Risk 4 — Email goes out twice

If both the webhook AND the user's "confirm" button fire, the
email could be sent twice.

**Mitigation:** the `Payment` model's `updated` event hook only
fires when `status` actually changes. So a duplicate webhook for an
already-paid payment does nothing. **Already implemented in
`Payment::booted()`.**

### Risk 5 — NotchPay sandbox is slow

NotchPay's sandbox (`NOTCHPAY_ENV=DEV`) can be slower than live
because of test-mode overhead. If you test in sandbox and feel
it's still too slow, that's a sandbox artifact. **Don't judge
performance on sandbox.** When you switch to `LIVE`, the charge
time will drop significantly.

### Risk 6 — Wrong email on notifications

The current `MAIL_FROM_ADDRESS` in your env is
`friendlymanf61@gmail.com` (a personal Gmail, per what you showed
earlier). If that's not what you want users to see, set
`MAIL_FROM_ADDRESS` to your business address before going live.

---

## 5. What you (the human) need to do on Railway

These are **env-var changes**, not code. Set them in your Railway
service env (in this order):

1. `PAYMENT_PROVIDER=notchpay` (probably already set)
2. `NOTCHPAY_PUBLIC_KEY=sb.YOUR_SANDBOX_KEY` (from NotchPay dashboard → Settings → Developer)
3. `NOTCHPAY_WEBHOOK_SECRET=...` (from NotchPay dashboard → Settings → Webhooks)
4. `NOTCHPAY_ENV=DEV` (for testing) → switch to `LIVE` when ready
5. `NOTCHPAY_INIT_TIMEOUT=30` (new)
6. `NOTCHPAY_CHARGE_TIMEOUT=90` (new)
7. `REDIS_QUEUE_RETRY_AFTER=180` (new)
8. **Make sure the `worker` service is running** (separate from the `web` service). The Procfile already has the right command.

**Also in the NotchPay dashboard:**

1. Settings → Webhooks → Add Endpoint:
   - URL: `https://<your-railway-app>.up.railway.app/api/payments/callback/notchpay`
   - Events: `payment.complete`, `payment.failed`, `payment.canceled`, `payment.expired`
2. Copy the webhook secret into Railway's `NOTCHPAY_WEBHOOK_SECRET` env var.
3. Test the webhook delivery from the dashboard.

---

## 6. Testing checklist (you do this, I don't)

### Stage 1 — Sandbox
- [ ] Set all 7 env vars on Railway
- [ ] Register the webhook in NotchPay dashboard
- [ ] Create a paid event in the app
- [ ] As a user, click "Pay with MTN"
- [ ] See "Check your phone" within 1 second ✓
- [ ] Use the NotchPay sandbox test number from the dashboard
- [ ] Approve the prompt on the (fake) phone
- [ ] Wait 5-10 seconds
- [ ] See the registration status flip to `confirmed` ✓
- [ ] Receive the confirmation email ✓
- [ ] Try MTN, then Orange, separately

### Stage 2 — Failure paths
- [ ] Try to pay with a wrong phone number → see clear error
- [ ] Try to pay, then close the browser → registration stays pending
- [ ] Reopen the event page → can retry the payment
- [ ] Try to pay twice quickly → no duplicate charges
- [ ] Reject the prompt on the fake phone → see "payment failed" within 30s

### Stage 3 — Go live
- [ ] Switch `NOTCHPAY_ENV=LIVE`
- [ ] Get a live public key from NotchPay
- [ ] Update the webhook secret
- [ ] Test with **your own real phone** and a small amount (e.g. 100 XAF)
- [ ] Confirm money actually moves and the registration is confirmed
- [ ] Only then: invite real users

---

## 7. What's NOT in this commit

- Frontend changes (separate commit, after you OK the backend)
- The `dev-up.sh` / `test-payment-flow.sh` local scripts (we agreed to drop those)
- Cloudflare R2 (separate, after payments are working)
- Email templates (the existing `PaymentReceivedNotification` is used as-is)

---

## 8. Commit message (preview)

```
fix(payments): make NotchPay instant + production-safe

UX: user clicks Pay → instant "Check your phone" message
instead of 5-30s spinner. The slow charge call now runs in
a queue job.

Bug fixes:
- Webhook signature header was wrong (X-Notchpay-Signature
  → X-Notch-Signature).
- Webhook payload parsing looked at root fields instead of
  data.transaction.* — every webhook would have been
  mis-classified as "failed".
- Customer email was falling back to "customer@example.com"
  — NotchPay rejects this in production.
- No Idempotency-Key on the init call — a user double-clicking
  "Pay" would create two NotchPay transactions.

New env vars: NOTCHPAY_INIT_TIMEOUT, NOTCHPAY_CHARGE_TIMEOUT,
REDIS_QUEUE_RETRY_AFTER. Worker --timeout raised to 130s.

See Backend/PAYMENTS_PLAN.md for the full design rationale
and the Railway env-var checklist.
```

---

## 9. Approval

Before I commit, I want you to read this plan and confirm:

- [ ] The design (instant response + background charge + webhook) makes sense
- [ ] You're OK with the 5 tradeoffs in section 4
- [ ] You'll set the 7 env vars + register the webhook before testing
- [ ] You'll go through the testing checklist in section 6

If anything is wrong, tell me. If it's all OK, say "go" and I'll
make the one commit.
