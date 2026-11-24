import http from 'node:http';
import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { getSetting } from './lib/settings.js';
import { setMarkupPercent } from './catalog/pricing.js';
import { initSocket } from './realtime/socket.js';
import { sweepStaleOrders } from './orders/reconcile.js';
import { releaseMaturedCommissions } from './affiliates/service.js';

// Last-resort safety net: log instead of letting the process die silently.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { err: String(err) });
});

async function bootstrap() {
  // Load persisted markup override (set via admin panel) if present.
  try {
    const saved = await getSetting('markup_percent');
    if (saved) setMarkupPercent(Number(saved));
  } catch (err) {
    logger.warn('Could not load saved settings', { err: String(err) });
  }

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer); // attach socket.io for live support chat

  // Every 30 min: settle unpaid checkouts with Stripe + release matured
  // affiliate commissions. First run shortly after boot.
  const housekeeping = () => {
    sweepStaleOrders().catch((err) => logger.warn('Order sweep failed', { err: String(err) }));
    releaseMaturedCommissions().catch((err) => logger.warn('Commission release failed', { err: String(err) }));
  };
  setTimeout(housekeeping, 60_000).unref();
  setInterval(housekeeping, 30 * 60_000).unref();

  httpServer.listen(env.PORT, () => {
    logger.info(`BackpackLink API listening on http://localhost:${env.PORT}`, {
      env: env.NODE_ENV,
      markup: `${env.MARKUP_PERCENT}%`,
      currency: env.DISPLAY_CURRENCY,
      fulfillment: env.FULFILLMENT_MODE,
    });
  });
}

bootstrap();
