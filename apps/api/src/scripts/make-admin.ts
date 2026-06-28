// Promote a user to admin: npm run make-admin -w @backpacklink/api -- you@email.com
import { prisma } from '../lib/db.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: tsx src/scripts/make-admin.ts <email>');
  process.exit(1);
}

const user = await prisma.user.update({
  where: { email: email.toLowerCase().trim() },
  data: { role: 'admin' },
});
console.log(`✅ ${user.email} is now an admin.`);
process.exit(0);
