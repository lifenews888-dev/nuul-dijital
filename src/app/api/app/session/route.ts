import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app";
import { requireDomainsModule } from "@/lib/domains/module-guard";

export const runtime = "nodejs";

/** Lightweight customer session probe for public checkout flows. */
export async function GET() {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ctx = await getAppContext();
  if (!ctx) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name ?? null,
    },
    organization: {
      id: ctx.organization.id,
      name: ctx.organization.name,
    },
  });
}