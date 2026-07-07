"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { DomainAiSuggestTab } from "@/components/domains/domain-ai-suggest-tab";
import { DomainCheckoutSheet } from "@/components/domains/domain-checkout-sheet";
import { DomainSearchForm } from "@/components/domains/domain-search-form";
import { DomainResultList } from "@/components/domains/domain-result-list";
import { DomainSuggestions } from "@/components/domains/domain-suggestions";
import { GrowthStackStrip } from "@/components/domains/growth-stack-strip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sanitizeDomainLabel } from "@/lib/domains/sanitize";
import { generateDomainSuggestions } from "@/lib/domains/suggestions";
import type { DomainSearchResponse, DomainSearchResult } from "@/lib/domains/types";
import { DEFAULT_TLDS } from "@/lib/domains/types";
import { track } from "@/lib/analytics";

type Props = {
  initialQuery?: string;
  onBuy?: (result: DomainSearchResult) => void;
  aiSuggestEnabled?: boolean;
};

export function DomainSearchPanel({ initialQuery = "", onBuy, aiSuggestEnabled = false }: Props) {
  const t = useTranslations("domains");
  const ta = useTranslations("domains.aiSuggest");
  const [query, setQuery] = useState(initialQuery);
  const [availableTlds, setAvailableTlds] = useState<string[]>([...DEFAULT_TLDS]);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([...DEFAULT_TLDS]);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyingDomain, setBuyingDomain] = useState<string | null>(null);
  const [checkoutDomain, setCheckoutDomain] = useState<DomainSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const journeyIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const invalidChars = query.length > 0 && /[^a-zA-Z0-9.-]/.test(query);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/domains/pricing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products?: Array<{ tld: string }> } | null) => {
        if (cancelled || !data?.products?.length) return;
        const tlds = data.products.map((p) => p.tld);
        setAvailableTlds(tlds);
        setSelectedTlds(tlds);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const clean = sanitizeDomainLabel(query);
      setDebouncedQuery(clean ?? "");
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      const clean = sanitizeDomainLabel(searchQuery);
      if (!clean || clean.length < 2 || selectedTlds.length === 0) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const res = await fetch("/api/domains/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: clean,
            tlds: selectedTlds,
            journeyId: journeyIdRef.current ?? undefined,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            setError(t("rateLimited"));
          } else if (data.code === "DOMAINS_DISABLED") {
            setError(t("moduleDisabled"));
          } else {
            setError(data.message ?? t("searchError"));
          }
          setResults([]);
          return;
        }

        const payload = data as DomainSearchResponse & { journeyId?: string | null };
        if (payload.journeyId) journeyIdRef.current = payload.journeyId;
        setResults(payload.results);

        track("domain_search", {
          query: payload.query,
          result_count: payload.results.length,
          cached: payload.cached,
          latency_ms: payload.latencyMs,
          available_count: payload.results.filter((r) => r.purchasable).length,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(t("searchError"));
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedTlds, t]
  );

  useEffect(() => {
    if (debouncedQuery.length >= 2 && !invalidChars) {
      runSearch(debouncedQuery);
    } else if (debouncedQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
    }
  }, [debouncedQuery, invalidChars, runSearch]);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    const mn = results.find((r) => r.tld === ".mn");
    if (!mn || mn.availability === "AVAILABLE") return [];
    return generateDomainSuggestions(debouncedQuery);
  }, [results, debouncedQuery]);

  const handleTldToggle = (tld: string) => {
    setSelectedTlds((prev) => {
      const next = prev.includes(tld) ? prev.filter((x) => x !== tld) : [...prev, tld];
      return next.length > 0 ? next : prev;
    });
  };

  const handleBuy = async (result: DomainSearchResult) => {
    if (!result.purchasable) return;
    track("domain_add_to_cart", {
      domain: result.domain,
      tld: result.tld,
      price: result.price,
    });
    setBuyingDomain(result.domain);
    try {
      if (onBuy) {
        onBuy(result);
      } else {
        setCheckoutDomain(result);
      }
    } finally {
      setBuyingDomain(null);
    }
  };

  const handleCheckoutSuccess = () => {
    setResults((prev) =>
      prev.map((r) =>
        r.domain === checkoutDomain?.domain
          ? { ...r, available: false, availability: "RESERVED", purchasable: false }
          : r
      )
    );
  };

  const searchPanel = (
    <div className="space-y-10">
      <DomainSearchForm
        query={query}
        onQueryChange={setQuery}
        selectedTlds={selectedTlds}
        availableTlds={availableTlds}
        onTldToggle={handleTldToggle}
        onSubmit={() => runSearch(query)}
        loading={loading}
        invalidChars={invalidChars}
        disabled={!!error && error === t("rateLimited")}
      />

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <DomainResultList
        results={results}
        loading={loading}
        showSkeleton={loading && results.length === 0 && hasSearched}
        onBuy={handleBuy}
        onRetry={() => runSearch(query)}
        buyingDomain={buyingDomain}
      />

      <DomainSuggestions
        suggestions={suggestions}
        onSelect={(label) => {
          setQuery(label);
          runSearch(label);
        }}
      />
    </div>
  );

  return (
    <div className="space-y-10">
      {aiSuggestEnabled ? (
        <Tabs defaultValue="search">
          <TabsList className="w-full justify-start sm:w-auto">
            <TabsTrigger value="search">
              <Search className="size-4" />
              {ta("searchTab")}
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="size-4" />
              {ta("tab")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search">{searchPanel}</TabsContent>
          <TabsContent value="ai">
            <DomainAiSuggestTab
              journeyIdRef={journeyIdRef}
              tlds={selectedTlds}
              onBuy={handleBuy}
              buyingDomain={buyingDomain}
            />
          </TabsContent>
        </Tabs>
      ) : (
        searchPanel
      )}

      <GrowthStackStrip />

      <DomainCheckoutSheet
        open={!!checkoutDomain}
        result={checkoutDomain}
        journeyId={journeyIdRef.current}
        onClose={() => setCheckoutDomain(null)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}