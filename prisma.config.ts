import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// This file configures the Prisma CLI (migrate, generate, studio) — it is
// NOT read at runtime by the app. The app's PrismaClient gets its connection
// from src/lib/prisma.ts instead. Both read the same DATABASE_URL from .env.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
