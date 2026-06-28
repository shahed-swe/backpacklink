# BackpackLink — eSIM Reseller Platform · Master Plan

> Web (Next.js) + API (Express) + Mobile (Flutter), reselling esimcard.com eSIMs internationally.
> This document is the source of truth for architecture & phasing. Last updated: 2026-06-28.

---

## 1. What we are building

A branded, SEO-friendly international eSIM store where:

- Customers browse data plans by **country / continent / global**, see **network coverage** (2G/3G/4G/5G), buy with a card, and instantly receive a **QR code / universal install link**.
- Customers manage everything (eSIMs, **data usage**, top-ups, order history) from a **web dashboard** and a **Flutter mobile app**.
- All customer accounts and the customer↔eSIM mapping live in **our own database**.
- The actual eSIM provisioning is done through the **esimcard.com Reseller API** behind the scenes.

Three deliverables share **one backend**:
1. **Next.js** marketing site + storefront + customer dashboard (SEO-first).
2. **Express** API / Backend-for-Frontend (BFF) — the only thing that talks to esimcard.
3. **Flutter** mobile app (consumes the same Express API).

---

## 2. The most important architectural truth (read this first)

The esimcard API is a **Reseller** API. It has **exactly one identity: your reseller account.**

- `/login` authenticates **YOUR** reseller account (email + password) and returns a JWT. That's the only auth that exists.
- **Customers do NOT and cannot sign up or log in on esimcard.** They sign up in **our** database only.
- Every eSIM ever purchased belongs to your **single** reseller account on esimcard's side.

### Consequence: WE own the customer↔eSIM mapping

esimcard has no idea which of your customers owns which eSIM. So:

```
Customer buys plan
   → our Express backend calls /package/purchase WITH THE RESELLER TOKEN
   → esimcard returns { id (esim uuid), iccid, universal_link, status }
   → WE STORE that id/iccid against the customer's row in OUR DB   ← the critical step
```

To show a customer their data later:

```
Customer opens "My eSIMs"
   → our backend reads THAT customer's iccid/esim_id from OUR DB
   → calls /my-esims/:id  and  /my-sim/:id/usage  with the reseller token
   → returns only that customer's eSIMs/usage
```

So the customer is identified by **phone/email in our DB**, and each eSIM is linked to them by the **iccid + esim uuid** that esimcard returns at purchase time. Exactly the model you guessed.

### Consequence: there are TWO separate money flows

| Flow | From → To | Mechanism |
|---|---|---|
| **Retail** | Customer → You | Your own payment gateway (card checkout). This is your revenue. |
| **Wholesale** | You → esimcard | esimcard debits your **prepaid reseller balance** on each purchase (`/balance`). |

You must keep your esimcard **balance funded**. If balance hits 0, purchases fail even though the customer paid. The backend must **check balance and alert you before it runs dry** (and ideally block/queue purchases that would overdraw).

### Consequence: you set the retail price (markup engine)

esimcard prices (e.g. `"price": "3.61"`) are **wholesale**. We apply a configurable **markup** (e.g. +35%, or per-region rules) to produce the retail price the customer pays. Margin = retail − wholesale.

---

## 3. Full endpoint inventory (what each is for)

Base URL: `https://portal.esimcard.com/api/developer/reseller`
Auth: `Authorization: Bearer <reseller_token>` on everything except `/login`.

### Auth
| Endpoint | Use in our system |
|---|---|
| `POST /login` | Backend logs in once, caches the token, re-logs in on 401. **Never exposed to customers.** |
| `POST /logout` | Rarely used; token invalidation. |

### Catalog / Bundles (read — for browsing)
| Endpoint | Use |
|---|---|
| `GET /pricing` | All bundles grouped by country + wholesale price. Good for a full catalog sync. |
| `GET /packages?package_type=DATA-ONLY\|DATA-VOICE-SMS` | Paginated package list (data/voice/sms, validity, type). |
| `GET /package/detail/:id` | Single package: allowances, price, **roaming countries + network coverage (2G/3G/4G/5G)**. Powers product pages. |
| `GET /packages/country` | List of countries that have packages (for country menu / landing pages). |
| `GET /packages/country/:id?package_type=` | Packages for one country. |
| `GET /packages/continent` | List of continents (regional plans). |
| `GET /packages/continent/{id}?package_type=` | Packages for a continent. |
| `GET /packages/global` | Global (multi-region) packages. |
| `GET /network-coverages` | Country → networks + supported generations. For a coverage checker feature. |

### Purchase / Fulfillment (write)
| Endpoint | Use |
|---|---|
| `POST /package/purchase` | Buy a **DATA-ONLY** package. Body: `package_type_id` (+ `imei` in samples). Returns instant (`sim_applied:true` w/ iccid) **or** delayed (`sim_applied:false`, "wait 2 min, poll My eSIMs"). |
| `POST /package/date_voice_sms/purchase` | Buy a **DATA-VOICE-SMS** package. |
| `POST /can-topup-esim` | Body: `iccid`. Checks if an existing eSIM can be topped up (re-buy onto same iccid). |

### Purchased eSIMs (read — for customer dashboard)
| Endpoint | Use |
|---|---|
| `GET /my-esims` | All eSIMs on the reseller account (iccid, status, `universal_link` for QR, last_bundle). We filter to the customer via our mapping. |
| `GET /my-esims/:id` | One eSIM + its `in_use_packages`. |
| `GET /my-sim/:id/usage` | **Remaining vs initial data** (handles "Unlimited"). The usage screen. |
| `GET /my-bundles` | All purchased bundles + remaining data + expiry. |
| `GET /bundles/:id` | One bundle's details. |
| `GET /order/:id` | Order status. |

### Account
| Endpoint | Use |
|---|---|
| `GET /balance` | Your reseller prepaid balance. Admin dashboard + low-balance guard. |

---

## 4. Known gaps & risks to validate against the LIVE API (do this in Phase 0)

The docs are example-only and have ambiguities. **We must verify these with a real token + a small funded balance before building on top of them:**

1. **IMEI requirement.** The `/package/purchase` JSON schema lists only `package_type_id`, but the code samples send `imei` too. Need to confirm whether IMEI is required, optional, or ignored for QR/universal-link eSIMs. (For QR-install eSIMs it's usually optional.)
2. **Instant vs delayed purchase.** Purchase can return `sim_applied:false` → we must **poll `/my-esims`** after ~2 min. Fulfillment must be an **async job**, not a synchronous request.
3. **No webhooks documented.** Usage & status updates are **pull-only**. We fetch usage on-demand (when the customer opens the screen) + cache briefly; we reconcile delayed purchases by polling.
4. **Token lifetime unknown.** Token looks like a Laravel Sanctum token. We implement a token manager that catches 401 and re-logs in transparently.
5. **No rate-limit docs.** We must **cache the catalog** in our DB (scheduled sync) and avoid hammering esimcard on every page view.
6. **Balance can run dry** → purchase fails post-payment. Need a balance guard + auto-refund/retry path.
7. **Refund / cancel.** No refund endpoint exists. Refund policy must be handled on **our** side (gateway refund) with clear ToS, since the wholesale cost may not be reversible.
8. **Currency.** Prices appear to be USD. Multi-currency display = our conversion layer; settlement currency depends on the payment gateway.

---

## 4a. Phase 0 validation results — live API, 2026-06-28 ✅

Ran a read-only probe (`scripts/probe.mjs`) against the real API with the reseller token. All endpoints returned HTTP 200. Findings:

- **Token works.** Reseller **balance = $15.26** (this is the prepaid pool that funds all provisioning).
- **Catalog scale:** **6,214** DATA-ONLY packages (311 pages) + **261** DATA-VOICE-SMS, across **214 countries** & **12 continents**. Cheapest ~ **$0.56** (1GB/3d Taiwan) → strong margins.
- **`/pricing` is SLOW (~47s)** because it returns ~6,000 packages at once. ⇒ **Confirmed: we must sync via paginated `/packages` into our DB cache and never live-fetch the catalog per page view.**
- **Packages are far richer than the docs.** Real fields include: `scope` (local/regional/global), `coverage[]` (per-network 2G/3G/4G/5G + flags/country/iso), `unlimited`, `tether`, `throttle` + `throttle_speed` + `unthrottle_data`, `connectivity`, `activation_type` (`PDP` = activates on first data use), `can_renew`, `banner`, `international_minutes/sms`, `apn`, `network`, `other_info`.
- **Install payload is complete** (from `/my-esims`): `qr_code_text` (LPA string → we render the QR ourselves), `smdp_address` + `matching_id` (manual install), `universal_link` (iOS one-tap), `android_universal_link` (Android one-tap), `apn`, `puk_code`, `status`. ⇒ We can deliver eSIMs fully (QR + one-tap + manual) without any extra endpoint.
- **IMEI looks OPTIONAL.** Existing eSIMs have `imei: null`. (Still confirm on a real purchase, but strong signal — no need to collect device IMEI at checkout.)
- **Account already has 2 test eSIMs** (Japan data, status `Released`) — presumably your earlier tests.
- ⚠️ **Field naming is inconsistent** across endpoints (`for-4G`, `fiv_5G`, `t_2G`, `th_3G` vs `four_G`; `romaing_countries` typo; `price` is sometimes string, sometimes number). ⇒ The backend will **normalize everything into clean internal types** so the frontend/app never see this mess.

Still to confirm with one cheap real purchase (needs your go-ahead, ~$0.56): exact `/package/purchase` response, instant-vs-delayed behavior, and whether `imei` is truly omittable.

## 5. System architecture

```
                 ┌────────────────────┐        ┌──────────────────────┐
   Browser  ───▶ │  Next.js (Vercel)  │        │   Flutter mobile app │
                 │  SSR/SSG storefront│        │  (iOS / Android)     │
                 │  + customer portal │        └──────────┬───────────┘
                 └─────────┬──────────┘                   │
                           │  HTTPS / JSON (our public API)│
                           ▼                               ▼
                 ┌─────────────────────────────────────────────────┐
                 │              Express API / BFF                    │
                 │  • Customer auth (JWT, our DB)                    │
                 │  • Catalog (served from cache)                   │
                 │  • Checkout + payment webhooks                   │
                 │  • Fulfillment worker (purchase + poll)          │
                 │  • eSIM/usage proxy (per-customer mapping)       │
                 │  • Pricing/markup engine                         │
                 │  • esimcard token manager + low-balance guard    │
                 └───────┬───────────────────────────┬──────────────┘
                         │                            │
              ┌──────────▼─────────┐      ┌───────────▼────────────┐
              │  PostgreSQL        │      │  esimcard Reseller API │
              │  (our database)    │      │  (single reseller acct)│
              │  users, esims,     │      └────────────────────────┘
              │  orders, payments, │
              │  catalog cache     │      ┌────────────────────────┐
              └────────────────────┘      │  Payment gateway        │
                                          │  (Stripe / Paddle)      │
                                          └────────────────────────┘
```

**Why Express is the only thing touching esimcard:** the reseller token is a master credential. It must never reach the browser or the phone. All esimcard calls are server-side.

### Suggested tech
- **Monorepo** (pnpm/turborepo): `apps/web` (Next.js), `apps/api` (Express + TypeScript), `apps/mobile` (Flutter), `packages/shared` (types).
- **DB:** PostgreSQL + Prisma. **Cache/queue:** Redis (token cache, catalog cache, fulfillment job queue via BullMQ).
- **Auth:** JWT access + refresh; phone OTP optional.
- **Payments:** see open decisions (§9).
- **Hosting:** Next.js → Vercel; Express + worker + Postgres + Redis → Railway/Render/Fly/VPS.

---

## 6. Core data model (our DB)

```
users            (id, name, email, phone, password_hash, country, currency, created_at)
esims            (id, user_id, provider_esim_id, iccid, universal_link, status,
                  last_bundle, last_synced_at, created_at)            ← the mapping
orders           (id, user_id, esim_id, provider_package_id, package_name,
                  package_type, retail_price, wholesale_price, currency,
                  status[pending|paid|fulfilling|completed|failed|refunded],
                  provider_order_ref, created_at)
payments         (id, order_id, gateway, gateway_ref, amount, currency, status)
package_cache    (provider_package_id, name, type, data_qty/unit, voice, sms,
                  validity, scope[country|continent|global], region_code,
                  countries_json, coverage_json, wholesale_price, retail_price,
                  unlimited, updated_at)                              ← synced catalog
pricing_rules    (id, scope, region_code, markup_percent, markup_flat, priority)
settings         (reseller_balance_cache, last_balance_check, ...)
```

---

## 7. Phase-by-phase plan

### Phase 0 — Foundations, decisions & live-API validation  *(before any product code)*
- Lock the open decisions in §9 (payment gateway is the big one).
- Obtain reseller API credentials; **fund a small test balance**.
- **Probe the live API** with a throwaway script: login → list packages → buy the cheapest package → confirm response shape, IMEI behavior, instant-vs-delayed, then fetch `/my-esims`, `/my-sim/:id/usage`, `/balance`. Document the *real* contracts.
- Decide brand identity (name = **BackpackLink**?), logo direction, color system.
- Scaffold monorepo, environments (dev/stage/prod), secrets management, CI.

### Phase 1 — Backend core (Express BFF + integration layer)
- **esimcard token manager**: login, cache token in Redis, auto-refresh on 401.
- **Catalog sync worker**: pull `/pricing`, `/packages`, country/continent/global, `/network-coverages` on a schedule → normalize into `package_cache`.
- **Pricing engine**: apply `pricing_rules` markup → retail prices.
- **Public catalog API** for web/mobile (served from cache, never live-proxied per request).
- **Customer auth** (our DB): signup/login with email + phone, JWT, password reset; phone OTP optional.
- DB schema + migrations (Prisma).

### Phase 2 — Purchase & fulfillment
- **Payment integration**: checkout session + **webhook** to confirm payment.
- **Fulfillment worker** (queue-based): on paid → balance guard → call `/package/purchase` or `/package/date_voice_sms/purchase` → handle **instant vs delayed** (poll `/my-esims`) → store `esims` row mapped to the user → mark order completed.
- **Delivery**: QR (`universal_link`) + install instructions via in-app + email.
- **Top-up flow**: `/can-topup-esim` → purchase onto existing iccid.
- **Low-balance guard** + admin alert; failed-fulfillment → auto-refund path.

### Phase 3 — Customer dashboard (web)
- My eSIMs (own DB mapping enriched via `/my-esims`, `/my-esims/:id`).
- **Usage screen** (`/my-sim/:id/usage`, handles Unlimited), QR re-display, install guide.
- Order history, bundle details, account settings.

### Phase 4 — Public storefront + SEO (Next.js)
- Home, **programmatic country/continent landing pages** (great SEO surface), package listing, product detail (coverage + networks), cart/checkout.
- **SEO**: SSG/ISR, per-page metadata, `Product`/`FAQ`/`BreadcrumbList` structured data, auto **sitemap.xml** + robots, fast Core Web Vitals, optional i18n + multi-currency, blog/guides.
- **Unique Tailwind design system** (custom components, motion, dark mode) — travel/backpacker brand feel.

### Phase 5 — Flutter mobile app
- Auth, catalog browse, product detail + coverage, **in-app purchase/checkout**, My eSIMs, usage, **QR / universal-link install** ("Add eSIM"), order history, push notifications (low data / expiry).
- Consumes the same Express API; ships to App Store + Play Store.

### Phase 6 — Admin panel
- Orders, customers, **balance monitoring**, pricing rules editor, catalog-refresh trigger, manual reconciliation, refunds, basic analytics.

### Phase 7 — Hardening & launch
- Security (gateway-handled PCI, secret hygiene, rate limiting, validation, CORS), observability (logging/metrics/alerts), legal (ToS, privacy, refund policy), analytics, load test, go-live + post-launch monitoring.

---

## 8. SEO strategy (since "SEO-friendly" is a hard requirement)
- **Render on the server** (SSG/ISR) so every country/plan page is crawlable HTML.
- **Programmatic pages**: `/esim/{country}`, `/esim/region/{continent}`, `/esim/global` — one indexable page per destination, generated from the catalog. This is the main organic-traffic engine for travel eSIM.
- Structured data (`Product` with price/availability, `FAQPage`, breadcrumbs), clean canonical URLs, `sitemap.xml`, image optimization, fast LCP.
- Content layer: destination guides / "how to install eSIM on iPhone/Android" articles.

---

## 9. Decisions (locked 2026-06-28)
1. **Payment gateway = Stripe.** ⚠️ Prerequisite: Stripe payouts aren't available to BD-based accounts directly, so this needs a foreign entity (e.g. Stripe Atlas US LLC, or a UK/other company / partner). Confirm the entity path before Phase 2 — the integration code itself is entity-agnostic, so we can build/test in Stripe **test mode** immediately regardless.
2. **Build order = Web first, then mobile.** Next.js storefront + dashboard (SEO engine) first, Flutter after, on the same backend.
3. **API access = ready.** Reseller login works and a small test balance can be funded → Phase 0 live-API probe can run now.

### Still to confirm (non-blocking, sensible defaults assumed)
- **Currency** — default: USD at launch, multi-currency display later.
- **Customer identity** — default: email + password primary, optional phone OTP later.

---

## 10. Immediate next steps
1. You answer §9 (esp. payment).
2. Confirm you have reseller API credentials + can fund a small test balance.
3. I build the **Phase 0 live-API probe script** to lock down the real contracts, then we scaffold the monorepo and start Phase 1.
