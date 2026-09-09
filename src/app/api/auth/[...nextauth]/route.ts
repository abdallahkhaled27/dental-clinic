import { handlers } from "@/auth";

// Coexists with the static /api/auth/login and /api/auth/logout routes
// (staff auth) under the same parent directory — Next.js matches exact
// static routes before falling back to a catch-all, so those two are
// unaffected. This catch-all only handles Auth.js's own endpoints
// (/api/auth/signin/google, /api/auth/callback/google, etc).
export const { GET, POST } = handlers;
