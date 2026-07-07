import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  createSupportTicket,
  listOrgTickets,
} from "@/lib/support/tickets";
import { createSupportTicketSchema } from "@/lib/validations/support";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ip = getClientIp(req);
  const rate = await rateLimit(`app-support:${ip}`, 30, 60_000);
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

  const tickets = await listOrgTickets(ctx.organization.id);

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ip = getClientIp(req);
  const rate = await rateLimit(`app-support-create:${ip}`, 10, 60_000);
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSupportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const ticket = await createSupportTicket(ctx.organization.id, ctx.user.id, parsed.data);

  return NextResponse.json({ ticket }, { status: 201 });
}