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
  },
});
