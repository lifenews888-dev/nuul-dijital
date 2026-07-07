"use client";

import { useCallback, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceCheckoutSheet } from "@/components/services/service-checkout-sheet";
import { ServiceWaitlistForm } from "@/components/services/service-waitlist-form";
import { formatDomainPrice } from "@/lib/domains/format";
import { cn } from "@/lib/utils";
import type { ServicePlanConfig } from "./service-landing-template";

type ServiceType = "hosting" | "email" | "ssl";

type Props = {
  service: ServiceType;
  journeyId?: string;
  plans?: ServicePlanConfig[];
  planLabels: Record<string, { name: string; features: string[] }>;
  plansTitle?: string;
  comingSoonLabel: string;
  notifyLabel: string;
  featuredLabel: string;
  pricePeriod: string;
  features?: string[];
  featuresTitle?: string;
  hostingNote?: string;
  waitlistTitle: string;
  waitlistSubtitle: string;
  locale: string;
  ordersEnabled?: boolean;
  orderLabel?: string;
};

export function ServiceLandingBody({
  service,
  journeyId,
  plans,
  planLabels,
  plansTitle,
  comingSoonLabel,
  notifyLabel,
  featuredLabel,
  pricePeriod,
  features,
  featuresTitle,
  hostingNote,
  waitlistTitle,
  waitlistSubtitle,
  locale,
  ordersEnabled = false,
  orderLabel,
}: Props) {
  const [selectedPlan, setSelectedPlan] = useState<{
    key: string;
    name: string;
    priceMnt: number;
  } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const waitlistRef = useRef<HTMLDivElement>(null);

  const scrollToWaitlist = useCallback((planName: string) => {
    setSelectedPlan({ key: "", name: planName, priceMnt: 0 });
    waitlistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openCheckout = useCallback(
    (plan: { key: string; name: string; priceMnt: number }) => {
      setSelectedPlan(plan);
      setCheckoutOpen(true);
    },
    []
  );

  return (
    <>
      {plans && plans.length > 0 && (
        <div className="mb-16">
          {plansTitle && (
            <Reveal>
              <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">{plansTitle}</h2>
            </Reveal>
          )}
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan, i) => {
              const meta = planLabels[plan.key];
              if (!meta) return null;
              return (
                <Reveal key={plan.key} delay={i * 0.06}>
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-3xl border bg-card p-6 sm:p-8",
                      plan.featured
                        ? "border-accent/40 shadow-lg shadow-accent/10"
                        : "border-white/10"
                    )}
                  >
                    {plan.featured && (
                      <Badge variant="accent" className="absolute -top-3 left-6">
                        {featuredLabel}
                      </Badge>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold">{meta.name}</h3>
                      {!ordersEnabled && <Badge variant="default">{comingSoonLabel}</Badge>}
                    </div>
                    <p className="mt-3">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {formatDomainPrice(plan.priceMnt, locale)}
                      </span>
                      <span className="text-sm text-muted-foreground">{pricePeriod}</span>
                    </p>
                    <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                      {meta.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.featured ? "gradient" : "outline"}
                      className="mt-6 w-full"
                      onClick={() =>
                        ordersEnabled && service !== "ssl"
                          ? openCheckout({ key: plan.key, name: meta.name, priceMnt: plan.priceMnt })
                          : scrollToWaitlist(meta.name)
                      }
                    >
                      {ordersEnabled && service !== "ssl" ? (orderLabel ?? notifyLabel) : notifyLabel}
                    </Button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      )}

      {features && features.length > 0 && (
        <Reveal>
          <div className="mx-auto mb-16 max-w-3xl rounded-3xl border border-white/10 bg-card p-8">
            {featuresTitle && (
              <h2 className="text-xl font-bold tracking-tight">{featuresTitle}</h2>
            )}
            <ul className={cn("flex flex-col gap-3", featuresTitle && "mt-6")}>
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            {hostingNote && (
              <p className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-muted-foreground">
                {hostingNote}
              </p>
            )}
          </div>
        </Reveal>
      )}

      {!ordersEnabled && (
        <Reveal>
          <div
            ref={waitlistRef}
            className="mx-auto max-w-2xl scroll-mt-28 rounded-3xl border border-white/10 bg-gradient-to-br from-accent/5 via-transparent to-accent-cyan/5 p-8"
          >
            <h2 className="text-xl font-bold tracking-tight">{waitlistTitle}</h2>
            <p className="mt-2 text-muted-foreground">{waitlistSubtitle}</p>
            <ServiceWaitlistForm
              service={service}
              journeyId={journeyId}
              selectedPlan={selectedPlan?.name ?? null}
              className="mt-6"
            />
          </div>
        </Reveal>
      )}

      {ordersEnabled && selectedPlan && service !== "ssl" && (
        <ServiceCheckoutSheet
          open={checkoutOpen}
          service={service}
          planKey={selectedPlan.key}
          planName={selectedPlan.name}
          priceMnt={selectedPlan.priceMnt}
          journeyId={journeyId}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}