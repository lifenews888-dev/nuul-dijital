import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getOrgTicketDetail } from "@/lib/support/tickets";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ip = getClientIp(req);
  const rate = await rateLimit(`app-support-detail:${ip}`, 60, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу." },
      { status: 429 }
    );
  }

  const ctx = await getAppContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await getOrgTicketDetail(ctx.organization.id, id, ctx.user.id);
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}