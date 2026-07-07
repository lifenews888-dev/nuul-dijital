import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app";
import { fetchOrganizationOrders } from "@/lib/app-orders";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ip = getClientIp(req);
  const rate = await rateLimit(`app-orders:${ip}`, 30, 60_000);
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

  const orders = await fetchOrganizationOrders(ctx.organization.id);

  return NextResponse.json({
    email: ctx.user.email,
    organization: {
      id: ctx.organization.id,
      name: ctx.organization.name,
      slug: ctx.organization.slug,
    },
    orders,
  });
}