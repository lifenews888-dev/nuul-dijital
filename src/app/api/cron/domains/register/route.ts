import { NextResponse } from "next/server";
import { processAutoRegistration } from "@/lib/domains/jobs/register";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Periodic cron — NO requireDomainsModule (in-flight auto-register must run). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processAutoRegistration();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/domains/register]", err);
    return NextResponse.json({ error: "Register job failed" }, { status: 500 });
  }
}