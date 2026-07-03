import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './env.js';
import { healthRouter } from './routes/health.js';
import { catalogRouter } from './routes/catalog.js';
import { authRouter } from './routes/auth.js';
import { checkoutRouter } from './routes/checkout.js';
import { meRouter } from './routes/me.js';
import { webhookRouter } from './routes/webhooks.js';
import { adminRouter } from './routes/admin.js';
import { supportRouter } from './routes/support.js';
import { communityRouter } from './routes/community.js';
import { rateLimit } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',').map((s) => s.trim()),
    }),
  );

  // Stripe webhook must receive the RAW body — mount before express.json().
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 20 }), authRouter);
  app.use('/api/checkout', rateLimit({ windowMs: 60_000, max: 30 }), checkoutRouter);
  app.use('/api/me', meRouter);
  app.use('/api/support', supportRouter);
  app.use('/api/community', communityRouter);
  app.use('/api/admin', adminRouter);

  app.get('/', (_req, res) => {
    res.json({ ok: true, service: 'BackpackLink API', docs: '/api/health' });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
