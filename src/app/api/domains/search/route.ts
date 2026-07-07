import { NextResponse } from "next/server";
import { searchDomains } from "@/lib/domains/rdap";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { hashIp, journeyCookieHeader, resolveJourney } from "@/lib/domains/journey";
import { persist } from "@/lib/persist";
import { getClientIp } from "@/lib/rate-limit";
import { guardMutation } from "@/lib/security";
import { domainSearchSchema } from "@/lib/validations/domains";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const { response } = await guardMutation(req, {
    key: "domain-search",
    limit: 20,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = domainSearchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query, tlds, journeyId } = parsed.data;
    const locale = req.headers.get("accept-language")?.startsWith("en") ? "en" : "mn";

    const search = await searchDomains(query, { tlds });
    if (!search) {
      return NextResponse.json(
        { error: "INVALID_DOMAIN_LABEL", message: "Домэйн нэр буруу байна" },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const journeyResult = await resolveJourney(req, journeyId, locale);

    await persist((db) =>
      db.domainSearch.create({
        data: {
          query: search.query,
          ipHash: hashIp(ip),
          userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
          resultCount: search.results.length,
          results: search.results,
          latencyMs: search.latencyMs,
          cached: search.cached,
        },
      })
    );

    const headers = new Headers({ "Content-Type": "application/json" });
    if (journeyResult?.setCookie) {
      headers.set("Set-Cookie", journeyCookieHeader(journeyResult.sessionKey));
    }

    return NextResponse.json(
      {
        ...search,
        journeyId: journeyResult?.journey.id ?? null,
      },
      { headers }
    );
  } catch (err) {
    console.error("[domains/search]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}