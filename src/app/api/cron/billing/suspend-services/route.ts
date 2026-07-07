import { NextResponse } from "next/server";
import { suspendOverdueServices } from "@/lib/billing/suspend";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Daily cron — pause subscriptions unpaid past grace period. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await suspendOverdueServices();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/billing/suspend-services]", err);
    return NextResponse.json({ error: "Suspend job failed" }, { status: 500 });
  }
}