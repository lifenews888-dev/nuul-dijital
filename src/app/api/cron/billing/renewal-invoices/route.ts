import { NextResponse } from "next/server";
import { generateRenewalInvoices } from "@/lib/billing/renewal";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Daily cron — generate upcoming renewal invoices. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateRenewalInvoices();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/billing/renewal-invoices]", err);
    return NextResponse.json({ error: "Renewal invoice job failed" }, { status: 500 });
  }
}