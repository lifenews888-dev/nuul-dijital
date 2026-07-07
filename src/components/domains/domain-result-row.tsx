"use client";

import { Globe, Loader2, RefreshCw, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DomainStatusBadge } from "@/components/domains/domain-status-badge";
import { formatDomainPrice } from "@/lib/domains/format";
import type { DomainSearchResult } from "@/lib/domains/types";
import { cn } from "@/lib/utils";

type Props = {
  result: DomainSearchResult;
  onBuy?: (result: DomainSearchResult) => void;
  onRetry?: () => void;
  buying?: boolean;
};

export function DomainResultRow({ result, onBuy, onRetry, buying }: Props) {
  const t = useTranslations("domains");
  const locale = useLocale();
  const muted = result.availability === "TAKEN" || result.availability === "RESERVED";

  return (
    <li
      role="listitem"
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/60 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
        muted && "opacity-75"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Globe
          className={cn("mt-0.5 size-5 shrink-0", result.purchasable ? "text-accent" : "text-muted-foreground")}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold tracking-tight">{result.domain}</span>
            <DomainStatusBadge availability={result.availability} />
          </div>
          {result.price > 0 && (
            <p className="mt-1 text-sm text-muted-foreground" aria-label={`${formatDomainPrice(result.price, locale)} ${t("perYear")}`}>
              <span className="font-bold text-foreground">{formatDomainPrice(result.price, locale)}</span>
              <span>{t("perYear")}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        {result.purchasable && onBuy ? (
          <Button
            variant="gradient"
            size="sm"
            disabled={buying}
            onClick={() => onBuy(result)}
            className="w-full sm:w-auto"
          >
            {buying ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
            {t("buy")}
          </Button>
        ) : result.availability === "UNKNOWN" && onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="w-full sm:w-auto">
            <RefreshCw />
            {t("retry")}
          </Button>
        ) : null}
      </div>
    </li>
  );
}