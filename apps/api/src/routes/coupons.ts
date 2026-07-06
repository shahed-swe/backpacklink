import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { catalog } from '../catalog/service.js';
import { evaluateCoupon } from '../coupons/service.js';

export const couponsRouter = Router();
couponsRouter.use(requireAuth);

const schema = z.object({ code: z.string().min(1).max(80), packageId: z.string().min(1) });

// POST /api/coupons/validate — preview the discount for a package + code, so
// the checkout UI can show the price before the customer pays. Server-authoritative.
couponsRouter.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { code, packageId } = schema.parse(req.body);
    const pkg = await catalog.packageDetail(packageId);
    if (!pkg) return res.status(404).json({ ok: false, error: 'Package not found' });

    const result = await evaluateCoupon(code, pkg.price.retail, pkg.price.wholesale, req.userId);
    res.json({
      ok: true,
      data: {
        valid: result.valid,
        reason: result.valid ? undefined : result.reason,
        discountAmount: result.discountAmount,
        finalPrice: result.finalPrice,
        basePrice: pkg.price.retail,
        currency: pkg.price.currency,
      },
    });
  }),
);
