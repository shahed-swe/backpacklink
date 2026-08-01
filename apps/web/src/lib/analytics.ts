import { GA_MEASUREMENT_ID } from './analytics-config';

// Meta Pixel (fbq) and Google gtag are injected by <Analytics/> and attached to
// window. These declarations let us call them type-safely from anywhere.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire a page-view on client-side (SPA) navigation. */
export function trackPageView(path?: string) {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'PageView');
  if (GA_MEASUREMENT_ID) window.gtag?.('event', 'page_view', path ? { page_path: path } : {});
}

/**
 * Conversion event — fired once when an order is completed.
 * Sends a Meta Pixel "Purchase" and a GA4 "purchase" with the order value.
 * The orderId is used as the Meta eventID so server-side de-duplication works
 * if a Conversions API is added later.
 */
export function trackPurchase(opts: { value: number; currency: string; orderId: string }) {
  if (typeof window === 'undefined') return;
  const { value, currency, orderId } = opts;

  window.fbq?.('track', 'Purchase', { value, currency }, { eventID: orderId });

  if (GA_MEASUREMENT_ID) {
    window.gtag?.('event', 'purchase', {
      transaction_id: orderId,
      value,
      currency,
    });
  }
}
