import type { NextFunction, Request, Response } from 'express';

// Tiny in-memory rate limiter (no dependency). For multi-instance production,
// swap the Map for Redis. Good enough to blunt brute-force on auth/checkout.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip ?? 'unknown'}:${req.baseUrl}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retry = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ ok: false, error: 'Too many requests — please slow down.' });
    }
    next();
  };
}
