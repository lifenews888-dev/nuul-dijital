"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";

const STEP_KEYS = ["domain", "hosting", "email", "website", "ai"] as const;

export function GrowthStackStrip() {
  const t = useTranslations("domains.growthStack");

  return (
    <Reveal>
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-accent/10 via-transparent to-accent-cyan/5 p-6 lg:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("label")}
        </p>
        <p className="mt-2 text-lg font-bold">{t("title")}</p>
        <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm font-medium">
          {STEP_KEYS.map((key, i) => (
            <li key={key} className="flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                {t(`steps.${key}`)}
              </span>
              {i < STEP_KEYS.length - 1 && (
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}