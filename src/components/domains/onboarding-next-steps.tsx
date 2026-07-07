"use client";

import { ArrowRight, Check, Mail, Server, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type CrossSellTarget = "hosting" | "email" | "website";

type StepConfig = {
  key: "domain" | "hosting" | "email" | "website";
  done?: boolean;
  target?: CrossSellTarget;
  href?: string;
  icon: typeof Check;
};

const STEPS: StepConfig[] = [
  { key: "domain", done: true, icon: Check },
  { key: "hosting", target: "hosting", href: "/hosting", icon: Server },
  { key: "email", target: "email", href: "/business-email", icon: Mail },
  { key: "website", target: "website", href: "/quote", icon: Sparkles },
];

type Props = {
  domain: string;
  journeyId?: string | null;
  className?: string;
};

function buildHref(step: StepConfig, domain: string, journeyId?: string | null): string {
  const params = new URLSearchParams();
  if (journeyId) params.set("journey", journeyId);
  if (step.key === "website") params.set("domain", domain);
  const qs = params.toString();
  return qs ? `${step.href}?${qs}` : (step.href ?? "/");
}

export function OnboardingNextSteps({ domain, journeyId, className }: Props) {
  const t = useTranslations("domains.nextSteps");

  const handleClick = (target: CrossSellTarget) => {
    track("funnel_cross_sell_click", { target, journeyId: journeyId ?? "" });
  };

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-transparent to-accent-cyan/5 p-5 text-left",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("label")}
      </p>
      <p className="mt-1 font-semibold">{t("title")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle", { domain })}</p>

      <ol className="mt-5 flex flex-col gap-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const label = t(`steps.${step.key}`);

          if (step.done) {
            return (
              <li
                key={step.key}
                className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <Check className="size-4" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </li>
            );
          }

          const href = buildHref(step, domain, journeyId);

          return (
            <li key={step.key}>
              <Link
                href={href}
                onClick={() => step.target && handleClick(step.target)}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-accent/30 hover:bg-accent/5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-muted-foreground group-hover:border-accent/30 group-hover:text-accent">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{label}</span>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}