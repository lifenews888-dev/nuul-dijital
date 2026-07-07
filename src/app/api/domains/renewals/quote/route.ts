import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import {
  DomainRenewalError,
  domainRenewalErrorMessage,
  getRenewalContext,
} from "@/lib/domains/renewals";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ctx = await getAppContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sourceOrderId = new URL(req.url).searchParams.get("sourceOrderId");
  if (!sourceOrderId) {
    return NextResponse.json({ error: "sourceOrderId required" }, { status: 400 });
  }

  try {
    const ctxData = await getRenewalContext(sourceOrderId, ctx.organization.id);
    const { source, renewPriceMnt, pendingRenewalOrderId, renewable } = ctxData;

    return NextResponse.json({
      sourceOrderId: source.id,
      domainName: source.domainName,
      years: source.years,
      renewPriceMnt,
      minYears: source.tldProduct.minYears,
      maxYears: source.tldProduct.maxYears,
      domainExpiresAt: source.domainExpiresAt?.toISOString() ?? null,
      renewable,
      pendingRenewalOrderId,
    });
  } catch (err) {
    if (err instanceof DomainRenewalError) {
      const status = err.code === "SOURCE_NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { error: err.code, message: domainRenewalErrorMessage(err.code) },
        { status }
      );
    }
    console.error("[domains/renewals/quote]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}