import { NextResponse } from "next/server";
import { runDunning } from "@/lib/billing/renewal";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Daily cron — past-due reminders and OVERDUE transitions. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDunning();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/billing/dunning]", err);
    return NextResponse.json({ error: "Dunning job failed" }, { status: 500 });
  }
}