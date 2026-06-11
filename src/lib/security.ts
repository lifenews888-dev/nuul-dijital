import { NextResponse } from "next/server";
import { rateLimit, getClientIp, type RateLimitResult } from "./rate-limit";

/**
 * Same-origin check for state-changing API requests (CSRF mitigation).
 * Browsers always send Origin on cross-origin POST; we reject mismatches.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches may omit Origin; allow (cookies are SameSite=Lax)
  try {
    const allowed = new Set<string>();
    const host = req.headers.get("host");
    if (host) {
      allowed.add(`https://${host}`);
      allowed.add(`http://${host}`);
    }
    if (process.env.NEXT_PUBLIC_SITE_URL) allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

type GuardOptions = { key: string; limit?: number; windowMs?: number };

/**
 * Combined CSRF + rate-limit guard for mutation API routes.
 * Returns a NextResponse to short-circuit on failure, or null to proceed.
 */
export function guardMutation(
  req: Request,
  { key, limit = 5, windowMs = 60_000 }: GuardOptions
): { response: NextResponse | null; rate: RateLimitResult } {
  if (!isSameOrigin(req)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      rate: { success: false, remaining: 0, limit, reset: Date.now() },
    };
  }

  const ip = getClientIp(req);
  const rate = rateLimit(`${key}:${ip}`, limit, windowMs);
  if (!rate.success) {
    return {
      response: NextResponse.json(
        { error: "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rate.reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(rate.limit),
            "X-RateLimit-Remaining": String(rate.remaining),
          },
        }
      ),
      rate,
    };
  }

  return { response: null, rate };
}
