"use client";

import { useTranslations } from "next-intl";
import { DomainResultRow } from "@/components/domains/domain-result-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { DomainSearchResult } from "@/lib/domains/types";

type Props = {
  results: DomainSearchResult[];
  loading?: boolean;
  showSkeleton?: boolean;
  emptyMessage?: string;
  onBuy?: (result: DomainSearchResult) => void;
  onRetry?: () => void;
  buyingDomain?: string | null;
};

export function DomainResultList({
  results,
  loading,
  showSkeleton,
  emptyMessage,
  onBuy,
  onRetry,
  buyingDomain,
}: Props) {
  const t = useTranslations("domains");

  if (showSkeleton) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={t("resultsTitle")}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-5 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && results.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-muted-foreground">
        {emptyMessage ?? t("idleHint")}
      </p>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("resultsTitle")}
      </h2>
      <ul className="space-y-3" role="list" aria-busy={loading}>
        {results.map((r) => (
          <DomainResultRow
            key={r.domain}
            result={r}
            onBuy={onBuy}
            onRetry={onRetry}
            buying={buyingDomain === r.domain}
          />
        ))}
      </ul>
    </div>
  );
}