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
  if (!user) throw new AuthError('Invalid email or password', 401);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AuthError('Invalid email or password', 401);
  return issue(user);
}
