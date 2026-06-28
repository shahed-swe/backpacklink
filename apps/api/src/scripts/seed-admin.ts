// Seed/ensure an admin user from env (used by the Docker entrypoint).
// Set ADMIN_EMAIL + ADMIN_PASSWORD to enable. No-op if unset.
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db.js';

const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.log('No ADMIN_EMAIL/ADMIN_PASSWORD set — skipping admin seed.');
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
const user = await prisma.user.upsert({
  where: { email },
  update: { role: 'admin' },
  create: { email, passwordHash, role: 'admin', name: 'Admin' },
});
console.log(`✅ Admin ready: ${user.email}`);
process.exit(0);
