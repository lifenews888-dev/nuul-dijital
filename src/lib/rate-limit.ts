/**
 * Lightweight fixed-window rate limiter (in-memory).
 *
 * Suitable for single-instance / serverless-warm deployments. For multi-region
 * production behind several instances, swap the Map for Upstash Redis
 * (`@upstash/ratelimit`) — the call site API stays identical.
 */

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

// periodic cleanup to avoid unbounded growth
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of store) {
    if (b.resetAt < now) store.delete(key);
  }
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  limit: number;
  reset: number;
};

/**
 * @param key      unique identifier (e.g. `contact:<ip>`)
 * @param limit    max requests per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, limit, reset: now + windowMs };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return {
    success,
    remaining: Math.max(0, limit - bucket.count),
    limit,
    reset: bucket.resetAt,
  };
}

/**
 * Best-effort client IP from proxy headers.
 *
 * Prefer `x-real-ip` — on Vercel and most managed platforms it is set by the
 * edge proxy to the true connecting IP and overwrites any client-supplied value.
 * Fall back to the LAST `x-forwarded-for` hop (the entry appended by the nearest
 * trusted proxy), not the first, which is fully client-controlled and trivially
 * spoofed to defeat per-IP rate limiting.
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1]!;
  }
  return "127.0.0.1";
}
