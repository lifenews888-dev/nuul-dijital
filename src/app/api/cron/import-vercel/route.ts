import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { importVercelProjectsAsDrafts } from "@/lib/vercel";
import { CONTENT_TAG } from "@/lib/content";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily cron (configured in vercel.json) that pulls any new Vercel projects in
 * as DRAFT portfolio items. Vercel attaches `Authorization: Bearer $CRON_SECRET`
 * to cron requests; reject anything else so the endpoint can't be triggered by
 * the public.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const created = await importVercelProjectsAsDrafts();
    if (created > 0) revalidateTag(CONTENT_TAG);
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("[cron/import-vercel]", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
