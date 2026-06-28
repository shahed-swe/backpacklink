# BackpackLink — International eSIM Reseller Platform

Sell eSIM data plans worldwide on top of the **esimcard.com Reseller API**. Monorepo with four apps sharing one backend.

```
backpacklink/
├── apps/
│   ├── api/        Express + TypeScript backend (the ONLY thing that talks to esimcard)
│   ├── web/        Next.js 15 storefront + customer dashboard (SEO-first)
│   ├── admin/      Next.js 15 standalone admin panel (separate app)
│   └── mobile/     Flutter app (iOS / Android)
├── scripts/probe.mjs   read-only esimcard API probe
├── PLAN.md             full architecture & phased plan
└── .env                secrets (gitignored)
```

See **[PLAN.md](PLAN.md)** for the architecture rationale (esimcard is reseller-auth only; we map each eSIM to a customer in our own DB; two money flows: customer→you via Stripe, you→esimcard via prepaid balance).

---

## Prerequisites
- Node.js 18+ (tested on 23)
- Flutter 3.3+ (only for the mobile app)
- An esimcard reseller API token + a funded reseller balance (for live fulfillment)

## 1. Configure secrets
Copy `.env.example` to `.env` and fill in your token (already gitignored):

```bash
cp .env.example .env
```

Key settings:
| Var | Meaning |
|---|---|
| `ESIMCARD_TOKEN` | Your reseller Bearer token. **Rotate before production.** |
| `MARKUP_PERCENT` | Retail markup over wholesale (also editable live in the admin panel) |
| `DATABASE_URL` | `file:./dev.db` (SQLite dev) → swap to PostgreSQL for prod |
| `FULFILLMENT_MODE` | `mock` (no balance spent — for dev) or `live` (real eSIM purchase) |
| `STRIPE_SECRET_KEY` | Empty = dev simulate-pay mode; set `sk_test_...` for real Stripe |
| `JWT_SECRET` | Long random string for prod |

## 2. Install & set up the database
```bash
npm install
npm run db:push -w @backpacklink/api     # creates the SQLite DB
```

## 3. Run the apps
```bash
npm run dev:api      # backend  → http://localhost:4000
npm run dev:web      # website  → http://localhost:3000
npm run dev:admin    # admin    → http://localhost:3001
```

Make yourself an admin (after signing up once on the website):
```bash
npm run make-admin -w @backpacklink/api -- you@email.com
```
Then sign in at http://localhost:3001.

## 4. Mobile app
```bash
cd apps/mobile
flutter create --platforms=android,ios .   # generate native folders (first time only)
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:4000   # Android emulator -> host
```
(Use `http://localhost:4000` for iOS simulator; your LAN IP for a physical device.)

---

## Run with Docker (backend + admin panel)

The backend and admin panel are containerized. From the repo root (with your `.env` filled in):

```bash
docker compose up --build
```

- **API** → http://localhost:4000
- **Admin** → http://localhost:3001

On first boot the API container syncs the DB schema and **seeds an admin user** from
`ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults `admin@backpacklink.local` / `changeme123` — change them):

```bash
ADMIN_EMAIL=you@email.com ADMIN_PASSWORD=strongpass docker compose up --build
```

Notes:
- Secrets (`ESIMCARD_TOKEN`, `JWT_SECRET`, Stripe keys…) come from the root `.env` via `env_file` — they are **not** baked into the images.
- The SQLite DB persists in the `bpl-data` volume (`docker compose down -v` wipes it).
- The admin's API URL is baked at build time; rebuild if you change `NEXT_PUBLIC_API_URL`
  (`docker compose build --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com admin`).
- Stop with `docker compose down`.

---

## How it works (quick map)
- **Catalog**: backend pulls packages from esimcard on demand, caches them, applies your markup, and serves clean DTOs. The huge `/pricing` call is never used per request.
- **Auth**: customers live only in our DB (email + password, JWT). The esimcard token never leaves the backend.
- **Purchase**: customer pays (Stripe) → backend buys the eSIM with the reseller token → saves `iccid`/QR mapped to the customer → delivers QR + install links.
- **Dashboard**: customers see their eSIMs, live data usage, and orders (web + mobile).
- **Admin**: revenue/profit/balance overview, orders, customers, and **live price/markup control**.

## Going to production (checklist)
1. **Rotate** the esimcard token; keep it only in the server env.
2. Switch `DATABASE_URL` to PostgreSQL and change the Prisma `provider` to `postgresql`.
3. Set real `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`; point the webhook to `/api/webhooks/stripe`.
   - ⚠️ Stripe payouts require a supported business entity (e.g. a US LLC via Stripe Atlas) — Bangladesh-based accounts can't receive payouts directly.
4. Set `FULFILLMENT_MODE=live` and keep the reseller balance funded (the admin overview warns on low balance).
5. Set a strong `JWT_SECRET`, lock `CORS_ORIGINS` to your domains, deploy API + DB behind HTTPS.
6. Deploy web (Vercel), admin (private host), API + Postgres (Railway/Render/Fly/VPS).

## Reference scripts
- `npm run probe` — read-only check of the live esimcard API (token, balance, catalog).
