import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { EsimcardError } from '../esimcard/client.js';
import { AuthError } from '../auth/service.js';
import { logger } from '../lib/logger.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ ok: false, error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof AuthError) {
    return res.status(err.status).json({ ok: false, error: err.message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ ok: false, error: 'That value is already in use.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ ok: false, error: 'Record not found.' });
    }
    logger.error('Database error', { path: req.path, code: err.code });
    return res.status(500).json({ ok: false, error: 'Database error' });
  }
  if (err instanceof EsimcardError) {
    // 401 from esimcard = our token problem, not the customer's fault.
    const status = err.status === 401 ? 502 : err.status || 502;
    logger.error('Upstream esimcard error', { path: req.path, status: err.status, msg: err.message });
    return res.status(status).json({
      ok: false,
      error: 'Upstream provider error',
      detail: err.message,
    });
  }
  logger.error('Unhandled error', { path: req.path, err: String(err) });
  return res.status(500).json({ ok: false, error: 'Internal server error' });
}

// Wrap async route handlers so thrown errors reach the error middleware.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
