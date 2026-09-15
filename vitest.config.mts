import { defineConfig } from "vitest/config";

// Only covers pure logic (src/lib) — no jsdom/React setup, since nothing
// under test touches the DOM or the database. Route handlers and
// components stay covered by the manual end-to-end checks (curl + a real
// Postgres) done for each feature instead; this is for the validation
// rules that kept being the actual source of real bugs (timezone, closed
// days, same-day past times).
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    // Scoped to src/ — Vitest's default glob also matches *.spec.ts,
    // which is exactly the convention the Playwright suite under
    // tests/e2e uses (see playwright.config.ts); without this, `npm test`
    // tries to run those through Vitest too and fails immediately, since
    // they call Playwright's own test()/expect(), not Vitest's.
    include: ["src/**/*.test.ts"],
  },
});
