// Creates (or resets the password of) a staff account, reading
// ADMIN_EMAIL / ADMIN_PASSWORD from .env. There's no public sign-up page —
// this is an internal tool, so accounts are created by running this script
// directly: `npx tsx prisma/create-admin.ts`
//
// Re-running it with a new ADMIN_PASSWORD in .env doubles as a password
// reset for that account.
import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// Hashes the password directly with bcryptjs rather than importing
// hashPassword from src/lib/auth.ts — that file starts with
// `import "server-only"`, which only works inside Next.js's own build
// (it special-cases that import when bundling); run through plain tsx like
// this script is, it throws unconditionally.

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.staffUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Staff account ready: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
