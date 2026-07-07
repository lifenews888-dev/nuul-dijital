import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashIp, journeyCookieHeader, resolveJourney } from "@/lib/domains/journey";
import { requireAiSuggestEnabled, requireDomainsModule } from "@/lib/domains/module-guard";
import {
  checkSuggestedDomains,
  generateDomainCandidates,
  type SuggestSource,
} from "@/lib/domains/suggest-ai";
import { normalizeSuggestInput } from "@/lib/domains/transliterate";
import type { DomainSearchResult } from "@/lib/domains/types";
import { persist } from "@/lib/persist";
import { getClientIp } from "@/lib/rate-limit";
import { guardMutation } from "@/lib/security";
import { domainSuggestSchema } from "@/lib/validations/domains";

export const runtime = "nodejs";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedRun = {
  candidates: string[];
  checked: DomainSearchResult[];
  model: string | null;
  tokenUsage: number | null;
  source: SuggestSource;
  transliterated?: string;
};

function isFresh(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < CACHE_TTL_MS;
}

export async function POST(req: Request) {
  const moduleDisabled = await requireDomainsModule();
  if (moduleDisabled) return moduleDisabled;

  const aiDisabled = await requireAiSuggestEnabled();
  if (aiDisabled) return aiDisabled;

  const { response } = await guardMutation(req, {
    key: "domain-suggest",
    limit: 3,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = domainSuggestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, tlds, journeyId } = parsed.data;
    const locale =
      parsed.data.locale ??
      (req.headers.get("accept-language")?.startsWith("en") ? "en" : "mn");
    const inputText = normalizeSuggestInput(text);
    const ip = getClientIp(req);
    const journeyResult = await resolveJourney(req, journeyId, locale);

    let payload: CachedRun | null = null;
    let cached = false;

    if (process.env.DATABASE_URL) {
      try {
        const existing = await db.domainSuggestionRun.findFirst({
          where: { inputText, inputLocale: locale },
          orderBy: { createdAt: "desc" },
        });

        if (existing && isFresh(existing.createdAt) && existing.checked) {
          payload = {
            candidates: existing.candidates as string[],
            checked: existing.checked as DomainSearchResult[],
            model: existing.model,
            tokenUsage: existing.tokenUsage,
            source: "cache",
          };
          cached = true;
        }
      } catch (err) {
        console.error("[domains/suggest] cache read failed:", err);
      }
    }

    if (!payload) {
      const generated = await generateDomainCandidates(inputText, locale);
      const checked = await checkSuggestedDomains(generated.candidates, tlds);

      payload = {
        candidates: generated.candidates,
        checked,
        model: generated.model,
        tokenUsage: generated.tokenUsage,
        source: generated.source,
        transliterated: generated.transliterated,
      };

      await persist((db) =>
        db.domainSuggestionRun.create({
          data: {
            inputText,
            inputLocale: locale,
            candidates: generated.candidates,
            checked,
            model: generated.model,
            tokenUsage: generated.tokenUsage,
            ipHash: hashIp(ip),
            journeyId: journeyResult?.journey.id ?? null,
          },
        })
      );
    }

    const headers = new Headers({ "Content-Type": "application/json" });
    if (journeyResult?.setCookie) {
      headers.set("Set-Cookie", journeyCookieHeader(journeyResult.sessionKey));
    }

    return NextResponse.json(
      {
        inputText,
        transliterated: payload.transliterated ?? null,
        candidates: payload.candidates,
        results: payload.checked,
        cached,
        source: payload.source,
        model: payload.model,
        journeyId: journeyResult?.journey.id ?? null,
      },
      { headers }
    );
  } catch (err) {
    console.error("[domains/suggest]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}