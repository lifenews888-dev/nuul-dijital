/**
 * Rate limiter with Upstash Redis (production) or in-memory fallback (local dev).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

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

function rateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
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

export function isUpstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

const redis = isUpstashConfigured()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

let prodUpstashWarned = false;
function warnMissingUpstashInProduction() {
  if (prodUpstashWarned || process.env.NODE_ENV !== "production" || redis) return;
  prodUpstashWarned = true;
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN missing in production — using per-instance memory fallback (not safe for GA)."
  );
}

const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${limit}:${windowSec}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "nuul-rl",
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * @param key      unique identifier (e.g. `domain-search:<ip>`)
 * @param limit    max requests per window
 * @param windowMs window length in ms
 */
export async function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): Promise<RateLimitResult> {
  warnMissingUpstashInProduction();
  const limiter = getUpstashLimiter(limit, windowMs);
  if (limiter) {
    const { success, remaining, reset } = await limiter.limit(key);
    return {
      success,
      remaining: Math.max(0, remaining),
      limit,
      reset: reset ?? Date.now() + windowMs,
    };
  }
  return rateLimitInMemory(key, limit, windowMs);
}

/**
 * Best-effort client IP from proxy headers.
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