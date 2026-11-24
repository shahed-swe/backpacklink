# BackpackLink — Customer Email & Notifications: Analysis & Plan

_Status: DRAFT for review · Owner: engineering · Last updated: 2026-11-24_

## 1. Why this matters

Today a customer who buys an eSIM gets **nothing from us outside the app/website**: no confirmation, no receipt, no QR code by email, no reminder when checkout is left unfinished, no warning when their data is about to run out. That costs us in three ways:

1. **Lost sales** — customers who open Stripe checkout and leave (the large "pending" orders seen in the admin panel) are never followed up.
2. **Support load and trust** — buyers expect an emailed receipt and install instructions; without them they ask support or dispute the charge.
3. **No repeat business** — we have no channel to bring a traveller back for a top-up or their next trip.

There is also a **compliance gap**: our Terms say we deliver "your eSIM and receipts" by email, which we currently don't.

---

## 2. Current state (from codebase analysis)

| Capability | Status | Notes |
|---|---|---|
| Transactional email (any) | ❌ None | No mail provider, SMTP, or email library in `apps/api`. |
| Order confirmation / invoice | ❌ None | Orders and eSIMs are only visible inside the account on web/app. No invoice or PDF is generated. |
| eSIM QR / install instructions by email | ❌ None | Only shown in the web/app eSIM page. |
| Payment failed / abandoned checkout follow-up | ❌ None | A card decline is only shown on the Stripe page. Abandoned checkouts are now marked `abandoned` (see the order fix of 2026-11-23) but the customer is never contacted. |
| Refund / fulfilment-failure notice | ❌ None | Auto-refunds happen silently. |
| Forgot / reset password | ❌ None | Users who forget their password are locked out (needs email). |
| Welcome email | ❌ None | |
| Data-low / plan-expiry alerts | ❌ None | Live usage **is** already available (`getUsage()` used by `GET /api/me/esims/:id`) — can be reused. |
| Mobile push notifications | ❌ None | No FCM/APNs setup in `apps/mobile`. |
| Affiliate emails (approved, payout sent) | ❌ None | New affiliate portal has no email notifications. |
| Stripe's own receipt email | ❓ Unknown | Not controlled by code. Enabled in Stripe Dashboard → Settings → Customer emails. Only a basic payment receipt — no QR/install info. |

---

## 3. Quick win (no code, do today)

In the **Stripe Dashboard → Settings → Customer emails**, turn on:
- **Successful payments** — Stripe emails a payment receipt to the customer.
- **Refunds** — Stripe emails when a refund is issued.

This closes the most basic receipt gap immediately while the work below is built.

---

## 4. Proposed solution

### 4.1 Architecture

```
 order/auth/affiliate events ──► notify.ts (one place) ──► EmailLog table (dedupe + audit)
                                        │
                                        ├─► email provider (Resend) ── customer inbox
                                        └─► (phase 3) FCM push ───── mobile app
 housekeeping job (every 30 min, already exists) ──► abandoned-cart reminders, usage alerts
```

- **Provider:** **Resend** (recommended — simple API, free tier, good deliverability). Alternatives: Postmark, Amazon SES. Wrapped behind a small `sendEmail()` interface so the provider can be swapped.
- **Dev mode:** with no API key set, emails are written to the log (same pattern as Stripe's dev simulate-pay), so everything is testable locally.
- **Templates:** simple branded HTML + plain-text versions, rendered server-side (React Email or plain template strings), in `apps/api/src/notifications/templates/`.
- **`EmailLog` model:** `userId`, `type`, `refId` (orderId etc.), `status`, `providerId`, `createdAt`, unique on `(type, refId)` → never send the same email twice (webhook replays, sweeper re-runs).
- **Unsubscribe:** marketing-type emails (reminders, usage nudges, promos) get an unsubscribe link and respect a `User.marketingOptOut` flag. Transactional emails (receipt, refund, password reset) always send.

### 4.2 Emails — Phase 1 (transactional, highest priority)

| # | Email | Trigger | Content |
|---|---|---|---|
| 1 | **Order confirmation + invoice** | Order `completed` (in `fulfillOrder`) | Receipt/invoice (order no., plan, price, discount, date, payment ref), **eSIM QR code**, one-tap iOS/Android install links, install steps, link to account. Optional PDF invoice attachment. |
| 2 | **Payment received, eSIM delayed** | Order stuck in `fulfilling` > 5 min | "We've got your payment, your eSIM is on its way." |
| 3 | **Refund / fulfilment failed** | Order → `refunded` or `failed` after payment | Apology, refund amount, how long it takes, support link. |
| 4 | **Forgot / reset password** | New `POST /api/auth/forgot` + `POST /api/auth/reset` (time-limited signed token) | Reset link. Needs new web page + mobile screen. |
| 5 | **Welcome** | Signup | Short intro, how eSIMs work, compatible-device link. |

### 4.3 Emails — Phase 2 (recovery & engagement)

| # | Email | Trigger | Content |
|---|---|---|---|
| 6 | **Complete your purchase** (abandoned checkout) | Order still `pending`/`abandoned` ~1 h after checkout, no later paid order for the same user | Plan they picked, "Finish checkout" button. Optional one-time discount (admin setting, uses existing Coupon system). Max 1 reminder per order. |
| 7 | **Payment didn't go through** | Stripe session expired **with** a card error (`last_payment_error` — already read by `orders/reconcile.ts`) | "Your card was declined — try another card", link back to the plan. |
| 8 | **Data running low** | Housekeeping job: usage ≥ 80 % (reuse `getUsage()`) | Remaining data + "Top up" button. Max 1 per eSIM per bundle. |
| 9 | **Plan expiring** | ~24 h before validity ends | "Your plan ends tomorrow — top up / buy next trip." |
| 10 | **Affiliate: application approved / rejected** | Admin approve/reject | Link + code + dashboard link. |
| 11 | **Affiliate: payout sent** | Admin records payout | Amount, method, reference. |
| 12 | **Admin alert: new affiliate application** | Affiliate applies | To admin email(s). |

### 4.4 Phase 3 — mobile push notifications

- Add Firebase Cloud Messaging to the Flutter app (iOS needs an APNs key in the Apple developer account).
- New `DeviceToken` model + `POST /api/me/devices` to register tokens.
- Mirror key events as push: eSIM ready, data low, plan expiring, promo campaigns (admin-sendable from the Campaigns page).

### 4.5 Admin panel

- **Email log** page: what was sent to whom, status, and a **Resend** button (e.g. customer lost the QR email).
- **Settings:** toggle each automated email on/off; abandoned-cart discount % and delay; data-low threshold.
- On each order: "Email the eSIM again" button.

---

## 5. Prerequisites (need the owner's action)

1. **Choose the email provider** (recommended: Resend) and create the account; add the API key to the server env (`RESEND_API_KEY`, `EMAIL_FROM="BackpackLink <noreply@backpacklink.com>"`, `ADMIN_NOTIFY_EMAIL`).
2. **Verify the domain**: add the provider's **SPF, DKIM and DMARC** DNS records for `backpacklink.com` so mail doesn't land in spam.
3. **A support/reply-to address** customers can answer (e.g. `support@backpacklink.com`).
4. (Phase 3) **Firebase project** + **APNs key** for push notifications.

---

## 6. Rollout & estimate

| Phase | Scope | Rough effort |
|---|---|---|
| 0 | Stripe dashboard receipt toggles | 10 min, no code |
| 1 | Email infra, EmailLog, emails 1–5, forgot-password (web + app) | ~3–4 days |
| 2 | Emails 6–12, admin email log + settings | ~2–3 days |
| 3 | FCM push in Flutter + backend | ~3–4 days (+ App Store review) |

**Success metrics:** abandoned-checkout recovery rate, support tickets about "where is my eSIM/receipt", repeat-purchase / top-up rate, email open & click rates.

## 7. Risks / notes

- **Deliverability:** without SPF/DKIM the emails will go to spam — domain verification is a hard prerequisite.
- **Duplicates:** every send is keyed in `EmailLog` so retries/webhook replays can't double-send.
- **Privacy:** QR/eSIM install codes are sensitive (anyone with the code can install the eSIM) — send only to the account email, never to an address supplied in the request.
- **Consent:** reminder/usage/promo emails must honour unsubscribe; transactional ones don't need opt-in.
