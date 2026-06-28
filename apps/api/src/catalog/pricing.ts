import { env } from '../env.js';

// Markup engine. esimcard prices are WHOLESALE (deducted from our reseller
// balance). Retail = what the customer pays. Profit = retail - wholesale.
//
// The percentage is mutable at runtime so the admin panel can change it; it's
// seeded from env and can be persisted via the Setting table.
let markupPercent = env.MARKUP_PERCENT;

export function setMarkupPercent(value: number) {
  if (Number.isFinite(value) && value >= 0) markupPercent = value;
}

export function getMarkupPercent(): number {
  return markupPercent;
}

export function retailPrice(wholesale: number): number {
  if (!Number.isFinite(wholesale) || wholesale <= 0) return 0;
  let price = wholesale * (1 + markupPercent / 100);
  if (env.MARKUP_MIN_PROFIT > 0 && price - wholesale < env.MARKUP_MIN_PROFIT) {
    price = wholesale + env.MARKUP_MIN_PROFIT;
  }
  return Math.round(price * 100) / 100;
}

export const displayCurrency = env.DISPLAY_CURRENCY;
