import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { esimcard } from '../esimcard/service.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, service: 'backpacklink-api', time: new Date().toISOString() });
});

// Confirms our reseller token still works + surfaces the prepaid balance.
healthRouter.get(
  '/upstream',
  asyncHandler(async (_req, res) => {
    const balance = await esimcard.getBalance();
    res.json({ ok: true, upstream: 'esimcard', tokenValid: balance.status, balance: balance.balance });
  }),
);
