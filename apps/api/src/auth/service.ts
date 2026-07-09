import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from '../lib/db.js';
import { signToken } from './jwt.js';

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  country?: string;
}

export function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    country: u.country,
    role: u.role,
    createdAt: u.createdAt,
  };
}

function issue(user: User) {
  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  return { token, user: publicUser(user) };
}

export async function signup(input: SignupInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AuthError('An account with this email already exists', 409);

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: input.name, phone: input.phone, country: input.country },
  });
  return issue(user);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || user.deletedAt) throw new AuthError('Invalid email or password', 401);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AuthError('Invalid email or password', 401);
  return issue(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new AuthError('Account not found', 404);
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new AuthError('Current password is incorrect', 400);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

/**
 * Permanently delete a customer account (App Store guideline 5.1.1(v) / GDPR).
 *
 * Orders and eSIMs are financial and provisioning records we're required to
 * keep, and their `userId` is a non-nullable foreign key — so rather than
 * deleting the user row we scrub every piece of personal data from it and mark
 * it deleted. Support conversations and community tips are personal content and
 * are removed outright. Once `deletedAt` is set the account can never sign in
 * again, and any token already issued for it stops working (see requireAuth).
 */
export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new AuthError('Account not found', 404);
  if (user.role === 'admin') throw new AuthError('Admin accounts cannot be deleted here', 403);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AuthError('Password is incorrect', 400);

  // Hash outside the transaction — bcrypt is deliberately slow.
  const deadHash = await bcrypt.hash(randomUUID(), 10);

  await prisma.$transaction(async (tx) => {
    const thread = await tx.supportThread.findUnique({ where: { userId } });
    if (thread) {
      await tx.supportMessage.deleteMany({ where: { threadId: thread.id } });
      await tx.supportThread.delete({ where: { id: thread.id } });
    }
    await tx.tip.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: {
        // Keep the row (orders/eSIMs point at it) but strip all identity.
        email: `deleted-${userId}@deleted.backpacklink.com`,
        name: null,
        phone: null,
        country: null,
        passwordHash: deadHash,
        deletedAt: new Date(),
      },
    });
  });
}
