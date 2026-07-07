"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Globe } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeDomainLabel } from "@/lib/domains/sanitize";
import { track } from "@/lib/analytics";

export function DomainSearchTeaser() {
  const t = useTranslations("home.domainTeaser");
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const clean = sanitizeDomainLabel(query);
    if (!clean) return;
    track("domain_teaser_search", { query: clean, source: "homepage_hero" });
    router.push(`/domains?q=${encodeURIComponent(clean)}`);
  };

  return (
    <div className="mt-8 w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur sm:p-5">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
        <Globe className="size-4 text-accent" aria-hidden />
        <span>{t("title")}</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder={t("placeholder")}
            aria-label={t("ariaLabel")}
            enterKeyHint="search"
            className="h-12 pr-12"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            .mn
          </span>
        </div>
        <Button type="button" variant="default" size="default" className="h-12 shrink-0" onClick={handleSearch}>
          {t("search")} <ArrowRight className="size-4" />
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">{t("example")}</p>
    </div>
  );
}