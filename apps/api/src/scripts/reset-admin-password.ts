// Reset (or ensure) an admin user's password.
// The password is read from NEW_ADMIN_PASSWORD (an env var, so it never appears
// in process arguments, shell history, or CI logs). Usage:
//   NEW_ADMIN_PASSWORD='...' npm run reset-admin -- <email>
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db.js';

const email = process.argv[2]?.toLowerCase().trim();
const password = process.env.NEW_ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Usage: NEW_ADMIN_PASSWORD=<pw> npm run reset-admin -- <email>');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
const user = await prisma.user.upsert({
  where: { email },
  update: { passwordHash, role: 'admin' },
  create: { email, passwordHash, role: 'admin', name: 'Admin' },
});
console.log(`✅ Admin password reset for ${user.email}`);
process.exit(0);
