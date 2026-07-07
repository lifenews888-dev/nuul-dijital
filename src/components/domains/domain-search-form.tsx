"use client";

import { Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_TLDS } from "@/lib/domains/types";
import { cn } from "@/lib/utils";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedTlds: string[];
  availableTlds?: string[];
  onTldToggle: (tld: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  invalidChars?: boolean;
  disabled?: boolean;
};

export function DomainSearchForm({
  query,
  onQueryChange,
  selectedTlds,
  onTldToggle,
  onSubmit,
  loading,
  invalidChars,
  disabled,
  availableTlds,
}: Props) {
  const tlds = availableTlds?.length ? availableTlds : [...DEFAULT_TLDS];
  const t = useTranslations("domains");
  const errorId = "domain-search-error";

  return (
    <div className="space-y-4">
      <div className="relative flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchAria")}
            aria-describedby={invalidChars ? errorId : undefined}
            aria-invalid={invalidChars || undefined}
            enterKeyHint="search"
            disabled={disabled}
            className="h-14 pl-11 text-base"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-accent" />
          )}
        </div>
        <Button
          type="button"
          variant="gradient"
          size="lg"
          onClick={onSubmit}
          disabled={disabled || loading}
          className="shrink-0"
        >
          {t("searchButton")}
        </Button>
      </div>

      {invalidChars && (
        <p id={errorId} className="text-sm text-red-400" role="alert">
          {t("invalidChars")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {tlds.map((tld) => {
          const active = selectedTlds.includes(tld);
          return (
            <button
              key={tld}
              type="button"
              onClick={() => onTldToggle(tld)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20"
              )}
              aria-pressed={active}
            >
              {tld}
            </button>
          );
        })}
      </div>
    </div>
  );
}