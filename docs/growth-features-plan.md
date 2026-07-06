# BackpackLink — Growth & Sales Features: Analysis & Implementation Plan

_Status: DRAFT for review · Owner: engineering · Last updated: 2026-07-06_

## 1. What the client asked for

1. **Promo/offer bar + campaign banner** on the web & mobile main page — a thin "bundle offer" strip sitting **above** a larger campaign banner (e.g. a **FIFA** promotion). Content must be editable without a code deploy.
2. **Coupon codes** so influencers can promote the app with a discount code.
3. **Attribution / visibility** — see **which influencer** drives sales (so we know who to keep paying) and **which site / source** drives the most sales.
4. **Admin panel redesign** — sales-focused, more visibility, refreshed design.

The unifying goal is **sales**: drive traffic (banners), incentivize it (coupons), and measure what's working (attribution + a sales-first admin).

---

## 2. Current state (from codebase analysis)

| Surface | Stack | Notes |
|---|---|---|
| **API** | Express 4 + Prisma 6 + **SQLite** + Stripe + socket.io (TypeScript/ESM, `tsx`) | Schema applied via `prisma db push` — **no migration files**. Catalog is fetched live from esimcard + priced in-memory (no Package table). |
| **Web** | Next.js 15 App Router, Tailwind, React 19 | Home/catalog = server components; checkout/account = client components. |
| **Admin** | Next.js 15 App Router, Tailwind ("lagoon" teal system), JWT admin auth | 7 pages, **no charting library**, client-side `useApi` fetch. |
| **Mobile** | Flutter, Provider/`ChangeNotifier`, `ApiClient` (get/post) | Home = `CustomScrollView` of slivers; checkout via `AccountService.checkout(packageId)`. |

**Data model today** (`apps/api/prisma/schema.prisma`): `User` (role `customer|admin`), `Order` (`retailPrice`, `wholesalePrice`, `currency`, `status`, `paymentProvider`, `paymentRef`, …), `Esim`, `Setting` (key-value; only `markup_percent` used), `SupportThread/Message`, `Tip`, `WebhookEvent`.

**Pricing** (`apps/api/src/catalog/pricing.ts`): `retail = wholesale × (1 + markup%/100)` with an optional min-profit floor. Snapshotted onto the order in `createOrderForPackage()` (`apps/api/src/orders/service.ts`) — **prices are computed server-side, never trusted from the client.** This is the single point where a discount must be applied.

### Gap analysis — everything requested is greenfield
| Requested | Exists today? |
|---|---|
| Admin-managed banners / promo bar | ❌ (only an unrelated provider `PackageDTO.banner` passthrough) |
| Coupons / discounts | ❌ no model, field, route, or logic |
| Influencer / referral / affiliate | ❌ none |
| Traffic-source / UTM / referrer capture | ❌ none |
| Sales analytics / charts | ⚠️ only `GET /api/admin/overview` aggregate; no charts in admin |
| Admin API + auth to build on | ✅ `requireAdmin` router + JWT already exist |
| Generic config store | ✅ `Setting` KV + `getSetting/setSetting` |

**Good news:** the admin auth, the server-side pricing choke point, and the aggregate-reporting pattern already exist — so we're extending clean seams, not fighting legacy.

### ⚠️ Two risks to flag before we scale sales on this
1. **Production runs on SQLite** (`file:/data/dev.db` on a Docker volume). Fine for today's volume, but a coupon/attribution/analytics workload means more concurrent writes and heavier reporting queries. **Recommendation:** migrate prod to **Postgres** (Prisma makes this a provider swap + real migrations). Not a blocker for these features, but should be scheduled. See §10.
2. **No migration history** (`db push` only). As the schema grows we should adopt `prisma migrate` so schema changes are reviewable and reversible.

---

## 3. Proposed architecture (one picture)

```
                        ┌──────────────── ADMIN (sales-focused redesign) ────────────────┐
                        │ Dashboard · Coupons · Influencers · Campaigns · Sources · …     │
                        └───────────────┬─────────────────────────────────┬───────────────┘
                                        │ admin CRUD + reports            │
                                        ▼                                 ▼
   Web  ─ promo bar + FIFA banner ─▶  ┌──────────────────── API (Express + Prisma) ─────────────────┐
   Mobile ─ promo bar + banner ────▶  │  NEW models: Promotion · Coupon · Influencer                │
   (both send couponCode + source)    │  Order += couponId, discountAmount, influencerId, source…    │
                                       │  checkout applies discount server-side + Stripe amount       │
                                       │  public GET /promotions · POST /coupons/validate             │
                                       └──────────────────────────────────────────────────────────────┘
```

Three new models, a handful of new `Order` columns, ~15 new endpoints, plus UI on all three surfaces. Details below.

---

## 4. Feature specifications

### 4.1 Campaign banner + promo bar ("Promotions")

One model powers both the thin **bar** and the larger **banner**, differentiated by `kind`. Admin-managed, scheduled, targetable to web/mobile/both.

**Data** — new `Promotion` model (see §5).

**API**
- Public: `GET /api/promotions?placement=web|mobile` → active, in-window promotions ordered by `priority`. (Cacheable; served next to catalog.)
- Admin: `GET/POST /api/admin/promotions`, `PATCH/DELETE /api/admin/promotions/:id`.

**Web** (`apps/web`)
- **Promo bar** → new element in `app/layout.tsx` **above** `<Header/>` (site-wide top strip). Fetch server-side via `lib/api.ts`.
- **Campaign banner** → new `<section>` in `app/page.tsx` **above** the `bg-lagoon` hero.
- Reuse `container-bp`, `chip`, `bg-sunset`/`bg-lagoon`, `btn-*`.

**Mobile** (`apps/mobile`)
- **Promo bar** → `SliverToBoxAdapter` as slot 0 in `home_screen.dart` (before `_Hero`).
- **Campaign banner** → `SliverToBoxAdapter` after `_Hero`.
- New `ConfigService.homeConfig()` on `AppState`; new `widgets/promo_bar.dart` + `widgets/campaign_banner.dart` styled from `BpColors`/`BpGradients`.

**Admin** — new **Campaigns** page: list + create/edit form (title, subtitle, image URL, colors, CTA label/URL, optional linked coupon, placement, priority, active, start/end), with a live preview.

### 4.2 Coupons & discounts

**Data** — new `Coupon` model (percent or fixed, limits, window, optional link to an influencer). New `Order` columns `couponId`, `couponCode`, `discountAmount`.

**Discount logic** (server-side only, in `createOrderForPackage`):
1. Look up coupon by code (case-insensitive), validate: `active`, within `startsAt/endsAt`, under `maxRedemptions`, under `perUserLimit`, `minSubtotal` met.
2. `discountAmount = type === 'percent' ? round(base × value/100) : min(value, base)`.
3. `retailPrice = base − discountAmount` (never below `wholesalePrice` unless we explicitly allow loss-leaders — default: floor at wholesale). Store `discountAmount`, `couponId`, `couponCode`.
4. Apply the **same** discounted amount to the Stripe session `amount`.
5. Increment `coupon.redemptions` **on successful payment** (in `markPaidAndFulfill`), not at cart creation, with an atomic guard so we never oversell a limited coupon.

> **Profit visibility:** `discountAmount` reduces `retailPrice`, so profit (`retail − wholesale`) automatically reflects the discount — the admin will see true margin after coupons.

**API**
- Public: `POST /api/coupons/validate { code, packageId }` → `{ valid, discountAmount, finalPrice, reason? }` for live checkout feedback (rate-limited).
- Admin: `GET/POST /api/admin/coupons`, `PATCH/DELETE /api/admin/coupons/:id`.
- Checkout body extended: `{ packageId, couponCode?, … }`.

**Web** — coupon `<input>` + "Apply" in `checkout/[id]/page.tsx` (inside the `card p-6`, above Pay); calls validate for instant feedback; sends `couponCode` in the checkout POST.

**Mobile** — `TextField` in `checkout_screen.dart` between the summary card and the pay button; `checkout(packageId, couponCode:)` → widened `AccountService.checkout`.

**Admin** — new **Coupons** page: table (code, type/value, used/limit, window, status, linked influencer) + create/edit; performance stats per coupon.

### 4.3 Influencer attribution

The core of "who is driving sales." Each influencer gets a unique **code** that works **two ways**, so we capture the sale whether or not the buyer types the coupon:

- **As a coupon** — buyer enters the code at checkout → discount + attribution.
- **As a ref link** — `https://backpacklink.com/?ref=CODE` → we store the code (cookie/local storage, 30-day window) and attribute any subsequent purchase, even with no coupon typed.

**Attribution precedence on an order:** coupon's influencer → else ref-link influencer → else none. Recorded as `Order.influencerId` (+ snapshot).

**Data** — new `Influencer` model (name, handle/platform, unique `refCode`, optional `commissionType/Value`), `Coupon.influencerId`, `Order.influencerId`.

**Capture**
- **Web:** small client component in `layout.tsx` reads `?ref=` (and UTM/referrer, §4.4) on first load → `localStorage`/cookie → included in the checkout POST body.
- **Mobile:** persist a `ref`/source in `shared_preferences` (from a deep link or first-run param) → attach to signup/checkout body (the payloads already accept arbitrary maps). _Note: true install-source needs platform work (Play Install Referrer / iOS) — out of scope for v1; deep-link `?ref=` covers the influencer case._

**API**
- Admin: `GET/POST /api/admin/influencers`, `PATCH/DELETE :id`.
- Report: `GET /api/admin/reports/influencers?from&to` → per-influencer orders, revenue, profit, discount given, (optional) commission owed — via the existing `groupBy`/`aggregate` pattern.

**Admin** — new **Influencers** page: roster + per-influencer performance (sales, revenue, profit, commission), "create influencer → auto-generate code + shareable ref link + optional coupon."

### 4.4 Traffic-source attribution ("which site sends sales")

**Data** — new `Order` columns: `source` (utm_source or referrer host), `medium`, `campaign`, `referrer`.

**Capture** — the same first-load client component (web) / shared_prefs (mobile) that captures `?ref=` also reads `utm_source/medium/campaign` and `document.referrer`; values ride along in the checkout POST and are persisted on the order. First-touch attribution (kept for the window), which is the standard for this use case.

**API / Admin** — `GET /api/admin/reports/sources?from&to` → sales grouped by `source`/`referrer`. New **Traffic Sources** admin view: table + bar chart of revenue by source.

> **Integrity note:** `source`/`ref` are client-supplied, so a determined user could spoof them. That only skews **reporting**, never price or money (discounts are validated server-side). Acceptable for marketing attribution; called out so we're clear-eyed about it.

### 4.5 Admin panel redesign (sales-focused)

Keep the existing teal "lagoon" brand system (`tailwind.config.ts`) but restructure around **sales visibility** and add real charts.

**New information architecture** (nav in `AdminShell.tsx`):
```
Dashboard(Sales) · Orders · Coupons · Influencers · Campaigns · Traffic Sources · Customers · Support · Community · Settings
```

**Sales Dashboard** (replaces today's static KPI grid):
- KPI row: Revenue, Profit, Orders, Avg order value, Discounts given, Conversion — each with a period delta.
- **Revenue & profit over time** (line/area chart, selectable range).
- **Top influencers** (bar) · **Top traffic sources** (bar/table) · **Coupon performance** (table).
- Global **date-range filter** driving all reports.

**Design refresh:** denser, data-first layout while keeping brand tokens (teal accents, sand background, rounded cards); add a lightweight chart library (**Recharts**, React 19-compatible) — none exists today; consolidate the ad-hoc `Stat`/`Row` helpers into shared components.

---

## 5. Data model changes (Prisma)

```prisma
model Promotion {
  id         String    @id @default(cuid())
  kind       String    // "bar" | "banner"
  title      String
  subtitle   String?
  imageUrl   String?
  bgColor    String?   // optional hex override
  textColor  String?
  ctaLabel   String?
  ctaUrl     String?
  couponCode String?   // optional: banner promotes a coupon
  placement  String    @default("both")   // "web" | "mobile" | "both"
  priority   Int       @default(0)
  active     Boolean   @default(true)
  startsAt   DateTime?
  endsAt     DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  @@index([active])
}

model Influencer {
  id             String   @id @default(cuid())
  name           String
  handle         String?
  platform       String?  // instagram | youtube | tiktok | ...
  email          String?
  refCode        String   @unique          // used in ?ref=CODE and (optionally) as a coupon
  commissionType String?  // "percent" | "fixed" | null
  commissionValue Float?
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  coupons        Coupon[]
  orders         Order[]
  @@index([refCode])
}

model Coupon {
  id             String   @id @default(cuid())
  code           String   @unique          // matched case-insensitively in app
  description    String?
  discountType   String   // "percent" | "fixed"
  discountValue  Float
  minSubtotal    Float?
  maxRedemptions Int?     // null = unlimited
  perUserLimit   Int?     @default(1)
  redemptions    Int      @default(0)
  active         Boolean  @default(true)
  startsAt       DateTime?
  endsAt         DateTime?
  influencerId   String?
  influencer     Influencer? @relation(fields: [influencerId], references: [id])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  orders         Order[]
  @@index([active])
}

// added to existing Order model:
//   couponId       String?
//   coupon         Coupon?     @relation(fields: [couponId], references: [id])
//   couponCode     String?
//   discountAmount Float       @default(0)
//   influencerId   String?
//   influencer     Influencer? @relation(fields: [influencerId], references: [id])
//   source         String?     // utm_source or referrer host or "direct"
//   medium         String?     // utm_medium
//   campaign       String?     // utm_campaign
//   referrer       String?
//   @@index([influencerId]) @@index([couponId]) @@index([source])
```

Applied via `npm run db:push` (dev) — **and this is the moment to introduce `prisma migrate`** so these become reviewable migrations.

---

## 6. API changes (summary)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/promotions?placement=` | public | Active bar+banner for storefront |
| POST | `/api/coupons/validate` | public (rate-limited) | Live discount preview |
| — | `POST /api/checkout` (extended) | user | Accept `couponCode`, `ref`, `source/medium/campaign/referrer` |
| GET/POST | `/api/admin/promotions` | admin | List / create |
| PATCH/DELETE | `/api/admin/promotions/:id` | admin | Edit / remove |
| GET/POST | `/api/admin/coupons` | admin | List / create |
| PATCH/DELETE | `/api/admin/coupons/:id` | admin | Edit / remove |
| GET/POST | `/api/admin/influencers` | admin | List / create |
| PATCH/DELETE | `/api/admin/influencers/:id` | admin | Edit / remove |
| GET | `/api/admin/reports/sales?from&to` | admin | Revenue/profit timeseries |
| GET | `/api/admin/reports/influencers?from&to` | admin | Sales per influencer |
| GET | `/api/admin/reports/sources?from&to` | admin | Sales per traffic source |
| GET | `/api/admin/reports/coupons?from&to` | admin | Coupon performance |

All admin routes hang off the existing `requireAuth + requireAdmin` router (`apps/api/src/routes/admin.ts`).

---

## 7. Security & integrity

- **Price/discount is server-authoritative** — coupon looked up and applied in `createOrderForPackage`; the client's price is never trusted. The Stripe `amount` is derived from the server-computed total.
- **Coupon limits enforced atomically** — `maxRedemptions`/`perUserLimit` checked at validate **and** re-checked at payment; `redemptions` incremented under a guarded update so a limited coupon can't be oversold under concurrency.
- **Discount floor** — default: never discount below `wholesalePrice` (no accidental loss-making sales) unless a coupon is explicitly flagged as a loss-leader.
- **Attribution is informational** — `ref`/`source` can be spoofed by users; this only affects reporting, not money. Documented, accepted.
- **Admin-only** — all management/report endpoints behind `requireAdmin`; validate endpoint rate-limited like `/api/checkout`.

---

## 8. Phased delivery plan

Ordered so the **FIFA banner ships first** (time-sensitive), then the money features, then attribution, then the admin glow-up.

| Phase | Scope | Surfaces | Ships |
|---|---|---|---|
| **0 — Foundation** | `Promotion`/`Coupon`/`Influencer` models + `Order` columns; adopt `prisma migrate`; seed helpers | API | Schema + empty admin CRUD scaffolds |
| **1 — Banners (FIFA)** ⭐ | `Promotion` CRUD + public `GET /api/promotions`; web promo bar (layout) + campaign banner (home); mobile promo bar + banner; admin **Campaigns** page | API · Web · Mobile · Admin | **Live FIFA bundle bar + banner, editable from admin** |
| **2 — Coupons** | `Coupon` CRUD + `validate` + checkout discount (web & mobile) + admin **Coupons** page | API · Web · Mobile · Admin | Working discount codes |
| **3 — Attribution** | `Influencer` CRUD; `?ref=` + UTM/referrer capture (web & mobile); order attribution; admin **Influencers** + **Traffic Sources** + reports | API · Web · Mobile · Admin | "Who/what drives sales" reporting |
| **4 — Admin redesign** | Sales dashboard with charts (Recharts), date-range filter, IA refresh, shared components | Admin | Sales-focused admin |

Phases 1–3 each end with the feature usable end-to-end. Phase 4 can also be interleaved (e.g. build each report as its phase lands).

---

## 9. Decisions needed (defaults in **bold**; change any before we build)

1. **Influencer model:** **code works as both coupon _and_ ref-link** (captures sales even without a typed coupon). Alt: coupon-only (simpler, misses un-couponed sales).
2. **Commission tracking:** **include optional commission fields + "owed" column** so you can see payouts. Alt: attribution only (no payout math).
3. **Discount types:** **support both percentage and fixed amount.**
4. **Discount floor:** **never sell below wholesale** by default.
5. **Attribution model:** **first-touch, 30-day window.**
6. **Start order:** **Phase 1 (FIFA banner) first**, given the tournament timing.
7. **Prod DB:** SQLite today — **recommend scheduling a Postgres migration** (separate track; not blocking).

---

## 10. Recommendations & risks

- **Postgres for production** before heavy campaign traffic — SQLite is a single-writer file DB; sales + analytics will stress it. Prisma swap + first real migration.
- **Adopt `prisma migrate`** starting with Phase 0 so schema changes are reviewable/reversible.
- **Cache `GET /api/promotions`** (short TTL) since it hits on every storefront page load.
- **Analytics tool (optional):** on-page events (banner clicks, coupon applies) are best captured with a lightweight analytics tool (e.g. PostHog/Plausible) in addition to order-level attribution. Out of scope for v1 but recommended for funnel visibility.
- **Idempotent redemption counting** tied to payment success, not cart creation, so abandoned carts don't burn coupon limits.

---

## 11. Rough effort

| Phase | Backend | Web | Mobile | Admin | ~Total |
|---|---|---|---|---|---|
| 0 Foundation | M | – | – | – | ~0.5 day |
| 1 Banners | S | M | M | M | ~1.5–2 days |
| 2 Coupons | M | S | S | M | ~2 days |
| 3 Attribution | M | M | M | M | ~2–3 days |
| 4 Admin redesign | S | – | – | L | ~2–3 days |

_Estimates assume the current single-dev setup and exclude the optional Postgres migration and third-party analytics._
