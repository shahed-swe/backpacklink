import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load env from the monorepo root .env (where the esimcard token lives),
// then allow a local apps/api/.env to override if present.
const here = path.dirname(fileURLToPath(import.meta.url)); // apps/api/src
const repoRoot = path.resolve(here, '../../..');
config({ path: path.join(repoRoot, '.env') });
config({ path: path.join(here, '..', '.env') }); // optional local override

function str(key: string, fallback?: string): string {
  const v = process.env[key];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

function num(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  NODE_ENV: str('NODE_ENV', 'development'),
  PORT: num('API_PORT', 4000),

  // esimcard reseller API
  ESIMCARD_BASE_URL: str('ESIMCARD_BASE_URL', 'https://portal.esimcard.com/api/developer/reseller'),
  ESIMCARD_TOKEN: str('ESIMCARD_TOKEN'),

  // Pricing / markup engine
  MARKUP_PERCENT: num('MARKUP_PERCENT', 50),
  MARKUP_MIN_PROFIT: num('MARKUP_MIN_PROFIT', 0),
  DISPLAY_CURRENCY: str('DISPLAY_CURRENCY', 'USD'),

  // CORS — comma separated origins, or "*"
  CORS_ORIGINS: str('CORS_ORIGINS', '*'),

  // Database
  DATABASE_URL: str('DATABASE_URL', 'file:./dev.db'),

  // Auth
  JWT_SECRET: str('JWT_SECRET', 'dev-only-change-me'),
  JWT_EXPIRES_IN: str('JWT_EXPIRES_IN', '30d'),

  // Stripe
  STRIPE_SECRET_KEY: str('STRIPE_SECRET_KEY', ''),
  STRIPE_WEBHOOK_SECRET: str('STRIPE_WEBHOOK_SECRET', ''),
  STRIPE_PUBLISHABLE_KEY: str('STRIPE_PUBLISHABLE_KEY', ''),

  // Fulfillment: "mock" (no balance spent) | "live"
  FULFILLMENT_MODE: str('FULFILLMENT_MODE', 'mock') as 'mock' | 'live',
  LOW_BALANCE_THRESHOLD: num('LOW_BALANCE_THRESHOLD', 10),

  // Web app URL (for Stripe redirect URLs)
  WEB_URL: str('WEB_URL', 'http://localhost:3000'),

  // Platform version shown in web/admin/mobile (single source of truth).
  APP_VERSION: str('APP_VERSION', '0.1.0'),

  // Uploaded images (banners). Stored on disk, served at /uploads.
  // In prod set to a persistent volume path (e.g. /data/uploads).
  UPLOAD_DIR: str('UPLOAD_DIR', './uploads'),
  // Optional explicit public base for building upload URLs; else derived from the request.
  PUBLIC_API_URL: str('PUBLIC_API_URL', ''),
};

// Accept standard secret keys (sk_) and restricted keys (rk_), test or live.
export const stripeEnabled = () => /^(sk|rk)_/.test(env.STRIPE_SECRET_KEY);

export type Env = typeof env;
