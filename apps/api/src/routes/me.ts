import { Router } from 'express';
import { z } from 'zod';
import type { Esim } from '@prisma/client';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { changePassword, deleteAccount } from '../auth/service.js';
import { prisma } from '../lib/db.js';
import { esimcard } from '../esimcard/service.js';
import { normalizeUsage } from '../esimcard/normalize.js';
import { isMockEsim } from '../orders/fulfillment.js';
import type { UsageDTO } from '../esimcard/types.js';

export const meRouter = Router();
meRouter.use(requireAuth);

async function getUsage(esim: Esim): Promise<UsageDTO & { mock?: boolean }> {
  if (isMockEsim(esim.providerEsimId)) {
    // Simulated usage for dev eSIMs (no upstream call).
    return {
      initialQuantity: 5,
      initialUnit: 'GB',
      remainingQuantity: 3.2,
      remainingUnit: 'GB',
      mock: true,
    };
  }
  const res = await esimcard.getEsimUsage(esim.providerEsimId);
  return normalizeUsage(res.data);
}

// GET /api/me/esims — the customer's eSIMs (from our mapping table).
meRouter.get(
  '/esims',
  asyncHandler(async (req, res) => {
    const esims = await prisma.esim.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ ok: true, data: esims });
  }),
);

// GET /api/me/esims/:id — one eSIM + live usage + install payload.
meRouter.get(
  '/esims/:id',
  asyncHandler(async (req, res) => {
    const esim = await prisma.esim.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!esim) return res.status(404).json({ ok: false, error: 'eSIM not found' });

    let usage: (UsageDTO & { mock?: boolean }) | null = null;
    try {
      usage = await getUsage(esim);
    } catch {
      usage = null; // usage temporarily unavailable; don't fail the page
    }
    res.json({ ok: true, data: { esim, usage } });
  }),
);

// GET /api/me/esims/:id/usage — live usage only.
meRouter.get(
  '/esims/:id/usage',
  asyncHandler(async (req, res) => {
    const esim = await prisma.esim.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!esim) return res.status(404).json({ ok: false, error: 'eSIM not found' });
    res.json({ ok: true, data: await getUsage(esim) });
  }),
);

// GET /api/me/orders — order history.
meRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      // Abandoned checkouts (never paid) are admin-only noise for the customer.
      where: { userId: req.userId, status: { not: 'abandoned' } },
      orderBy: { createdAt: 'desc' },
      include: { esim: true },
    });
    res.json({ ok: true, data: orders });
  }),
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// PATCH /api/me/password — change the signed-in customer's password.
meRouter.patch(
  '/password',
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changePassword(req.userId!, currentPassword, newPassword);
    res.json({ ok: true });
  }),
);

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// DELETE /api/me — permanently delete the account (App Store guideline 5.1.1(v)).
meRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const { password } = deleteAccountSchema.parse(req.body);
    await deleteAccount(req.userId!, password);
    res.json({ ok: true });
  }),
);
