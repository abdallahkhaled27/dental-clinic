import { config } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Match Next.js's own env file precedence (.env.local overrides .env) —
// plain `dotenv/config` only reads .env, which is why STRIPE_SECRET_KEY
// (kept in .env.local, alongside the other secrets not meant for git) was
// invisible to this test process even though the dev server it starts
// picks it up fine via Next's own loading.
config({ path: ".env" });
config({ path: ".env.local", override: true });

// Runs against the real dev server and the real local Postgres (via
// Docker) — same stack every manual end-to-end check in this project has
// used, not a separate mocked test environment. That's a deliberate
// trade-off for a project this size: it exercises the real Prisma
// queries, the real session cookies, the real validation — but it does
// mean Docker Postgres has to already be running (`docker compose up -d`)
// before `npm run test:e2e`, the same precondition as running the app
// itself.
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // Serial, not parallel: tests share one real database rather than an
  // isolated one per worker, so two tests racing to register the same
  // kind of account (or reading global-ish state like the admin
  // dashboard) could interfere with each other if run at the same time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
