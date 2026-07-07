import { NextResponse } from "next/server";
import { readOrderLookupEmail } from "@/lib/domains/order-lookup";
import {
  toPublicDomainOrderSummary,
  toPublicServiceOrderSummary,
} from "@/lib/domains/order-lookup-public";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { db } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ip = getClientIp(req);
  const rate = await rateLimit(`order-lookup-orders:${ip}`, 30, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу." },
      { status: 429 }
    );
  }

  const email = readOrderLookupEmail(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const emailFilter = { equals: email, mode: "insensitive" as const };

    const [domainOrders, serviceOrders] = await Promise.all([
      db.domainOrder.findMany({
        where: { customerEmail: emailFilter },
        include: { payment: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.serviceOrder.findMany({
        where: { customerEmail: emailFilter },
        include: { payment: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const orders = [
      ...domainOrders.map(toPublicDomainOrderSummary),
      ...serviceOrders.map(toPublicServiceOrderSummary),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    return NextResponse.json({
      email,
      orders,
    });
  } catch (err) {
    console.error("[orders/lookup/orders]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}