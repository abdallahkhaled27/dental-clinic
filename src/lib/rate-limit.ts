// A simple in-memory, fixed-window rate limiter — one counter per key,
// reset once its window passes. Good enough for this app's actual scale
// (one clinic, low traffic, a single server process); it does NOT work
// correctly across multiple server instances (each would have its own
// counters) or survive a restart (counters reset to zero). If this app
// ever runs on multiple instances (see Feature 11), this would need to
// move to a shared store (e.g. a database table or Redis) instead.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

// Best-effort client identifier. Behind a reverse proxy (Vercel, most
// hosts) the real client IP arrives in x-forwarded-for; in plain local
// dev that header is usually absent, so every request falls back to the
// same "unknown" bucket — fine for testing, but worth knowing.
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}
