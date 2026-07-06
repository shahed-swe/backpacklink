import { prisma } from '../lib/db.js';

export function normalizeRef(code: string): string {
  return code.trim().toUpperCase();
}

/** Resolve a ?ref=CODE value to an active influencer id (else null). */
export async function resolveInfluencerIdByRef(ref: string | null | undefined): Promise<string | null> {
  if (!ref || !ref.trim()) return null;
  const refCode = normalizeRef(ref);
  const inf = await prisma.influencer.findUnique({ where: { refCode } });
  return inf && inf.active ? inf.id : null;
}

/** Commission owed on a set of attributed sales, per the influencer's terms. */
export function commissionOwed(
  influencer: { commissionType: string | null; commissionValue: number | null },
  revenue: number,
  orderCount: number,
): number {
  const v = influencer.commissionValue ?? 0;
  if (!influencer.commissionType || !v) return 0;
  const owed = influencer.commissionType === 'percent' ? revenue * (v / 100) : v * orderCount;
  return Math.round(owed * 100) / 100;
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Suggest a unique-ish ref code from a name (e.g. "Jane Doe" -> "JANE7K2"). */
export function generateRefCode(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'REF';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `${base}${suffix}`;
}
