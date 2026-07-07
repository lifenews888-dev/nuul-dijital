import { lookupRdap } from "@/lib/domains/rdap";
import {
  applyReservationOverlay,
  getInternallyReservedDomains,
  getTldPricingMap,
  resolveTlds,
  toSearchResult,
} from "@/lib/domains/pricing";
import { sanitizeDomainLabel } from "@/lib/domains/sanitize";
import { generateDomainSuggestions } from "@/lib/domains/suggestions";
import { hasCyrillic, toDomainLabel, transliterateMn } from "@/lib/domains/transliterate";
import type { DomainSearchResult } from "@/lib/domains/types";

const MAX_CANDIDATES = 10;
const MAX_TLDS = 2;
const DEFAULT_SUGGEST_TLDS = [".mn", ".com"];

const SYSTEM_PROMPT = `You generate brandable domain name labels for Mongolian businesses.
Return ONLY valid JSON with this shape: {"labels":["label1","label2"]}
Rules:
- Latin lowercase a-z, digits 0-9, hyphens only (no dots / TLDs)
- 3–20 characters per label
- 8–12 unique, memorable, pronounceable labels
- Relevant to the business description
- Prefer short compound words over long phrases`;

export type SuggestSource = "ai" | "rules" | "cache";

export type SuggestGenerationResult = {
  candidates: string[];
  model: string | null;
  tokenUsage: number | null;
  source: "ai" | "rules";
  transliterated?: string;
};

function normalizeLabel(label: string): string | null {
  const clean = label
    .toLowerCase()
    .trim()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]/g, "");
  return sanitizeDomainLabel(clean);
}

function parseLabelsJson(text: string): string[] {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(raw) as { labels?: unknown; candidates?: unknown } | unknown[];
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { labels?: unknown }).labels)
        ? (parsed as { labels: unknown[] }).labels
        : Array.isArray((parsed as { candidates?: unknown }).candidates)
          ? (parsed as { candidates: unknown[] }).candidates
          : [];

    const labels = new Set<string>();
    for (const item of list) {
      const label = normalizeLabel(String(item));
      if (label) labels.add(label);
    }
    return Array.from(labels).slice(0, MAX_CANDIDATES);
  } catch {
    return [];
  }
}

async function callAnthropic(userPrompt: string): Promise<{ labels: string[]; model: string; tokenUsage: number | null } | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    console.error("[suggest-ai] anthropic", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  const labels = parseLabelsJson(text);
  if (labels.length === 0) return null;

  const usageTotal = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
  const tokenUsage = usageTotal > 0 ? usageTotal : null;

  return { labels, model, tokenUsage };
}

async function callOpenAI(userPrompt: string): Promise<{ labels: string[]; model: string; tokenUsage: number | null } | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[suggest-ai] openai", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const text = data.choices?.[0]?.message?.content ?? "";
  const labels = parseLabelsJson(text);
  if (labels.length === 0) return null;

  return { labels, model, tokenUsage: data.usage?.total_tokens ?? null };
}

function generateCandidatesFallback(text: string, transliterated?: string): string[] {
  const seeds = new Set<string>();

  const primary = toDomainLabel(text);
  if (primary) {
    seeds.add(primary);
    for (const s of generateDomainSuggestions(primary)) seeds.add(s);
  }

  if (transliterated && transliterated !== text) {
    const tLabel = toDomainLabel(transliterated);
    if (tLabel) {
      seeds.add(tLabel);
      for (const s of generateDomainSuggestions(tLabel)) seeds.add(s);
    }
  }

  const words = (transliterated ?? text)
    .toLowerCase()
    .split(/[\s,.-]+/)
    .map((w) => toDomainLabel(w))
    .filter((w): w is string => !!w);

  for (const w of words) seeds.add(w);
  if (words.length >= 2) seeds.add(words.slice(0, 2).join(""));

  return Array.from(seeds).slice(0, MAX_CANDIDATES);
}

function buildUserPrompt(text: string, locale: string, transliterated?: string): string {
  const lines = [
    `Locale: ${locale}`,
    `Business description: ${text}`,
  ];
  if (transliterated && transliterated !== text) {
    lines.push(`Transliterated hint: ${transliterated}`);
  }
  lines.push("Generate domain labels (no TLD suffix).");
  return lines.join("\n");
}

/** Generate domain label candidates via LLM with rule-based fallback. */
export async function generateDomainCandidates(
  text: string,
  locale = "mn"
): Promise<SuggestGenerationResult> {
  const transliterated = hasCyrillic(text) ? transliterateMn(text) : undefined;
  const userPrompt = buildUserPrompt(text, locale, transliterated);

  const ai =
    (await callAnthropic(userPrompt).catch(() => null)) ??
    (await callOpenAI(userPrompt).catch(() => null));

  if (ai && ai.labels.length > 0) {
    return {
      candidates: ai.labels,
      model: ai.model,
      tokenUsage: ai.tokenUsage,
      source: "ai",
      transliterated,
    };
  }

  return {
    candidates: generateCandidatesFallback(text, transliterated),
    model: null,
    tokenUsage: null,
    source: "rules",
    transliterated,
  };
}

function sortResults(results: DomainSearchResult[]): DomainSearchResult[] {
  const rank = (r: DomainSearchResult) => {
    if (r.availability === "AVAILABLE") return 0;
    if (r.availability === "UNKNOWN") return 1;
    if (r.availability === "RESERVED") return 2;
    return 3;
  };

  return [...results].sort((a, b) => rank(a) - rank(b) || a.domain.localeCompare(b.domain));
}

/** RDAP-check candidate labels against the given TLDs. */
export async function checkSuggestedDomains(
  labels: string[],
  tlds?: string[]
): Promise<DomainSearchResult[]> {
  const uniqueLabels = [...new Set(labels.map((l) => normalizeLabel(l)).filter(Boolean))] as string[];

  const [pricingMap, reserved] = await Promise.all([
    getTldPricingMap(),
    getInternallyReservedDomains(),
  ]);

  const allowed = pricingMap.size > 0 ? [...pricingMap.keys()] : DEFAULT_SUGGEST_TLDS;
  const resolvedTlds = resolveTlds(tlds, allowed).slice(0, MAX_TLDS);

  const lookups = await Promise.all(
    uniqueLabels.flatMap((label) =>
      resolvedTlds.map(async (tld) => {
        const domain = `${label}${tld}`;
        const lookup = await lookupRdap(domain);
        return toSearchResult(domain, tld, lookup.availability, pricingMap.get(tld));
      })
    )
  );

  return sortResults(applyReservationOverlay(lookups, reserved));
}