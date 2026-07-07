import { NextResponse } from "next/server";
import { probeRdap } from "@/lib/domains/rdap";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { checkRateLimitBackend } from "@/lib/rate-limit-health";

export const runtime = "nodejs";

export async function GET() {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  try {
    const [probe, rateLimit] = await Promise.all([probeRdap("nuul.digital"), checkRateLimitBackend()]);
    const ok = probe.ok && rateLimit.ok;
    return NextResponse.json(
      {
        ok,
        rdap: {
          ok: probe.ok,
          latencyMs: probe.latencyMs,
          rdapStatus: probe.rdapStatus,
          availability: probe.availability,
        },
        rateLimit,
        checkedAt: new Date().toISOString(),
      },
      { status: ok ? 200 : 503 }
    );
  } catch (err) {
    console.error("[health/domains]", err);
    return NextResponse.json(
      { ok: false, error: "Probe failed" },
      { status: 500 }
    );
  }
}