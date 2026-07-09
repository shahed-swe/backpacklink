import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/jwt.js';
import { prisma } from '../lib/db.js';

// Augment Express Request with the authenticated user context.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      userEmail?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }

  try {
    // A token outlives the account it was issued for, so re-check the account
    // still exists and hasn't been deleted before trusting the token's claims.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
    }
    req.userId = user.id;
    req.userRole = user.role;
    req.userEmail = user.email;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ ok: false, error: 'Admin access required' });
  }
  next();
}
