"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { DomainAvailability } from "@/lib/domains/types";

const STYLES: Record<DomainAvailability, string> = {
  AVAILABLE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  TAKEN: "border-red-500/30 bg-red-500/10 text-red-400",
  UNKNOWN: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  RESERVED: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

export function DomainStatusBadge({ availability }: { availability: DomainAvailability }) {
  const t = useTranslations("domains.status");
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STYLES[availability]
      )}
    >
      {t(availability)}
    </span>
  );
}