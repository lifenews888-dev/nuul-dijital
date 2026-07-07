import { NextResponse } from "next/server";
import { checkRateLimitBackend } from "@/lib/rate-limit-health";

export const runtime = "nodejs";

/** Deploy smoke test — no auth; does not expose secrets. */
export async function GET() {
  const health = await checkRateLimitBackend();
  return NextResponse.json(
    {
      ...health,
      checkedAt: new Date().toISOString(),
    },
    { status: health.ok ? 200 : 503 }
  );
}