import "dotenv/config";
import { ensureDentistExists } from "./helpers/db";

// Runs once before the whole suite, not per-test — cheap idempotency
// check either way, but there's no reason to hit the database 14 times
// for something that only ever needs doing once per environment.
export default async function globalSetup() {
  await ensureDentistExists();
}
