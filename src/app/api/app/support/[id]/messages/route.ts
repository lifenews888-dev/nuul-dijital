import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { addCustomerTicketMessage } from "@/lib/support/tickets";
import { customerTicketMessageSchema } from "@/lib/validations/support";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ip = getClientIp(req);
  const rate = await rateLimit(`app-support-msg:${ip}`, 20, 60_000);
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

  const parsed = customerTicketMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await params;

  try {
    const ticket = await addCustomerTicketMessage(
      ctx.organization.id,
      id,
      ctx.user.id,
      parsed.data.body
    );
    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof Error && err.message === "TICKET_CLOSED") {
      return NextResponse.json(
        { error: "Ticket is closed", code: "TICKET_CLOSED" },
        { status: 409 }
      );
    }
    throw err;
  }
}