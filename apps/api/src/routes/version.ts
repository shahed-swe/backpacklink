import { Router } from 'express';
import { env } from '../env.js';

export const versionRouter = Router();

// GET /api/version — public platform version, shown in web/admin/mobile footers.
versionRouter.get('/', (_req, res) => {
  res.json({ ok: true, version: env.APP_VERSION });
});
