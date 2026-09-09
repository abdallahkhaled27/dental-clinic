import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a "driver adapter" — a small package that does the
// actual TCP/SQL talking to a specific database — instead of the bundled
// query engine older Prisma versions used. PrismaPg is the adapter for
// plain PostgreSQL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// Next.js's dev server hot-reloads modules on every file save, which would
// normally create a brand-new PrismaClient (and a new DB connection pool)
// each time. Stashing the instance on `globalThis` survives the reload, so
// only one PrismaClient exists per running process.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
