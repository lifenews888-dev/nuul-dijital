import { NextResponse } from "next/server";
import { getBankSettings, isBankConfigured } from "@/lib/domains/bank-settings";
import { requireDomainsModule } from "@/lib/domains/module-guard";

export const runtime = "nodejs";

export async function GET() {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const bank = await getBankSettings();
  return NextResponse.json({
    ...bank,
    configured: isBankConfigured(bank),
  });
}