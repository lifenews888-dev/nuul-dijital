"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { DomainResultList } from "@/components/domains/domain-result-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";
import type { DomainSearchResult } from "@/lib/domains/types";

type SuggestResponse = {
  results?: DomainSearchResult[];
  transliterated?: string | null;
  source?: string;
  cached?: boolean;
  journeyId?: string | null;
  code?: string;
  message?: string;
};

type Props = {
  journeyIdRef: React.MutableRefObject<string | null>;
  tlds: string[];
  onBuy?: (result: DomainSearchResult) => void;
  buyingDomain?: string | null;
};

export function DomainAiSuggestTab({ journeyIdRef, tlds, onBuy, buyingDomain }: Props) {
  const t = useTranslations("domains.aiSuggest");
  const [text, setText] = useState("");
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [meta, setMeta] = useState<{
    transliterated?: string | null;
    source?: string;
    cached?: boolean;
  } | null>(null);

  const sourceLabel =
    meta?.source === "ai"
      ? t("sourceAi")
      : meta?.source === "rules"
        ? t("sourceRules")
        : meta?.source === "cache"
          ? t("sourceCache")
          : null;

  async function generate() {
    const trimmed = text.trim();
    if (trimmed.length < 3) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/domains/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          tlds: tlds.slice(0, 2),
          journeyId: journeyIdRef.current ?? undefined,
        }),
      });

      const data = (await res.json()) as SuggestResponse;

      if (!res.ok) {
        if (res.status === 429) {
          setError(t("rateLimited"));
        } else if (data.code === "AI_SUGGEST_DISABLED") {
          setError(t("disabled"));
        } else if (data.code === "DOMAINS_DISABLED") {
          setError(t("disabled"));
        } else {
          setError(data.message ?? t("error"));
        }
        setResults([]);
        return;
      }

      if (data.journeyId) journeyIdRef.current = data.journeyId;

      const nextResults = data.results ?? [];
      setResults(nextResults);
      setMeta({
        transliterated: data.transliterated,
        source: data.source,
        cached: data.cached,
      });
      setHasGenerated(true);

      track("domain_ai_suggest", {
        source: data.source ?? "",
        cached: !!data.cached,
        result_count: nextResults.length,
        available_count: nextResults.filter((r) => r.purchasable).length,
      });
    } catch {
      setError(t("error"));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-accent" aria-hidden />
          <div>
            <h3 className="font-semibold tracking-tight">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("hint")}</p>
          </div>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          rows={4}
          className="min-h-[120px] resize-y text-base"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void generate();
            }
          }}
        />

        {text.trim().length > 0 && text.trim().length < 3 && (
          <p className="mt-2 text-xs text-muted-foreground">{t("minLength")}</p>
        )}

        <Button
          type="button"
          variant="gradient"
          className="mt-4"
          disabled={loading || text.trim().length < 3}
          onClick={() => void generate()}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>
      </div>

      {meta?.transliterated && (
        <p className="text-sm text-muted-foreground">
          {t("transliterated")}:{" "}
          <span className="font-mono text-foreground">{meta.transliterated}</span>
          {sourceLabel && (
            <span className="ml-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs">
              {sourceLabel}
            </span>
          )}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <DomainResultList
        results={results}
        loading={loading}
        showSkeleton={loading && results.length === 0 && hasGenerated}
        emptyMessage={hasGenerated ? undefined : t("idleHint")}
        onBuy={onBuy}
        buyingDomain={buyingDomain}
      />
    </div>
  );
}