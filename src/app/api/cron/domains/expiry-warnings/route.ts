import { NextResponse } from "next/server";
import { sendDomainExpiryWarnings } from "@/lib/domains/expiry-warnings";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Daily cron — 30 / 14 / 7 day domain expiry reminder emails. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDomainExpiryWarnings();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/domains/expiry-warnings]", err);
    return NextResponse.json({ error: "Domain expiry job failed" }, { status: 500 });
  }
}