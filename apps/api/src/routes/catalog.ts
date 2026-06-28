import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { catalog } from '../catalog/service.js';
import type { PackageType } from '../esimcard/types.js';

export const catalogRouter = Router();

function parseType(value: unknown): PackageType | undefined {
  if (value === 'DATA-ONLY' || value === 'DATA-VOICE-SMS') return value;
  return undefined;
}

// GET /api/catalog/countries
catalogRouter.get(
  '/countries',
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, data: await catalog.countries() });
  }),
);

// GET /api/catalog/continents
catalogRouter.get(
  '/continents',
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, data: await catalog.continents() });
  }),
);

// GET /api/catalog/countries/:id/packages?type=DATA-ONLY
catalogRouter.get(
  '/countries/:id/packages',
  asyncHandler(async (req, res) => {
    const data = await catalog.countryPackages(req.params.id, parseType(req.query.type));
    res.json({ ok: true, count: data.length, data });
  }),
);

// GET /api/catalog/continents/:id/packages?type=DATA-ONLY
catalogRouter.get(
  '/continents/:id/packages',
  asyncHandler(async (req, res) => {
    const data = await catalog.continentPackages(req.params.id, parseType(req.query.type));
    res.json({ ok: true, count: data.length, data });
  }),
);

// GET /api/catalog/global?type=DATA-ONLY
catalogRouter.get(
  '/global',
  asyncHandler(async (req, res) => {
    const data = await catalog.globalPackages(parseType(req.query.type) ?? 'DATA-ONLY');
    res.json({ ok: true, count: data.length, data });
  }),
);

// GET /api/catalog/packages?type=DATA-ONLY&page=1   (paginated raw catalog)
catalogRouter.get(
  '/packages',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const result = await catalog.packages(parseType(req.query.type) ?? 'DATA-ONLY', page);
    res.json({ ok: true, ...result });
  }),
);

// GET /api/catalog/packages/:id   (full detail w/ coverage)
catalogRouter.get(
  '/packages/:id',
  asyncHandler(async (req, res) => {
    const pkg = await catalog.packageDetail(req.params.id);
    if (!pkg) return res.status(404).json({ ok: false, error: 'Package not found' });
    res.json({ ok: true, data: pkg });
  }),
);
