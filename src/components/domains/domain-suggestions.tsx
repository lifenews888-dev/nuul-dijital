"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  suggestions: string[];
  onSelect: (label: string) => void;
  className?: string;
};

export function DomainSuggestions({ suggestions, onSelect, className }: Props) {
  const t = useTranslations("domains");

  if (suggestions.length === 0) return null;

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.02] p-5", className)}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-accent" aria-hidden />
        <h3 className="text-sm font-semibold">{t("suggestionsTitle")}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className="rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
          >
            {s}.mn
          </button>
        ))}
      </div>
    </div>
  );
}