"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/reveal";

const STEPS = [
  { key: "domain" as const, href: "/domains" },
  { key: "hosting" as const, href: "/hosting" },
  { key: "email" as const, href: "/business-email" },
  { key: "website" as const, href: "/quote" },
  { key: "ai" as const, href: "/services/ai-chatbots" },
];

export function GrowthStackStrip() {
  const t = useTranslations("domains.growthStack");

  return (
    <Reveal>
      <div className="rounded-3xl border border-border bg-gradient-to-br from-accent/10 via-transparent to-accent-cyan/5 p-6 lg:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("label")}
        </p>
        <p className="mt-2 text-lg font-bold text-foreground">{t("title")}</p>
        <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm font-medium">
          {STEPS.map((step, i) => (
            <li key={step.key} className="flex items-center gap-2">
              <Link
                href={step.href}
                className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-foreground/90 transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
              >
                {t(`steps.${step.key}`)}
              </Link>
              {i < STEPS.length - 1 && (
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}