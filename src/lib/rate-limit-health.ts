import { isUpstashConfigured, rateLimit } from "@/lib/rate-limit";

export type RateLimitHealth = {
  backend: "upstash" | "memory";
  configured: boolean;
  ok: boolean;
  productionSafe: boolean;
  error?: string;
};

/** Probe Upstash / fallback for deploy smoke tests and health endpoints. */
export async function checkRateLimitBackend(): Promise<RateLimitHealth> {
  const configured = isUpstashConfigured();
  const isProd = process.env.NODE_ENV === "production";

  if (!configured) {
    return {
      backend: "memory",
      configured: false,
      ok: !isProd,
      productionSafe: false,
      error: isProd
        ? "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required in production"
        : undefined,
    };
  }

  try {
    const probeKey = `health-probe:${Date.now()}`;
    await rateLimit(probeKey, 5, 60_000);
    return {
      backend: "upstash",
      configured: true,
      ok: true,
      productionSafe: true,
    };
  } catch (err) {
    return {
      backend: "upstash",
      configured: true,
      ok: false,
      productionSafe: false,
      error: err instanceof Error ? err.message : "Upstash probe failed",
    };
  }
}