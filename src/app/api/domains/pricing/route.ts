import { NextResponse } from "next/server";
import { getActiveTldPricing } from "@/lib/domains/pricing";
import { requireDomainsModule } from "@/lib/domains/module-guard";

export const runtime = "nodejs";

export async function GET() {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  try {
    const products = await getActiveTldPricing();
    return NextResponse.json({
      currency: "MNT",
      products: products.map((p) => ({
        tld: p.tld,
        labelMn: p.labelMn,
        labelEn: p.labelEn,
        registerPrice: p.registerPrice,
        renewPrice: p.renewPrice,
        transferPrice: p.transferPrice,
        minYears: p.minYears,
        maxYears: p.maxYears,
        featured: p.featured,
      })),
    });
  } catch (err) {
    console.error("[domains/pricing]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}