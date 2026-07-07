import { NextResponse } from "next/server";
import { expireStalePayments } from "@/lib/domains/expire-payments";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Hourly cron — NO requireDomainsModule (must run when module disabled). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireStalePayments();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/domains/expire-payments]", err);
    return NextResponse.json({ error: "Expire job failed" }, { status: 500 });
  }
}