"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Counter } from "@/components/motion/counter";
import { stats, values } from "@/data/company";

export function WhyNuul() {
  const t = useTranslations("home.whyNuul");
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
      <div className="container-wide">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Sticky statement */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <span className="section-label">
              <span className="size-1.5 rounded-full bg-accent" />
              {t("label")}
            </span>
            <h2 className="mt-6 text-display-lg font-bold tracking-tight">
              {t.rich("title", {
                br: () => <br />,
                accent: (c) => <span className="text-gradient-accent">{c}</span>,
              })}
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              {t("description")}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {stats.map((s) => (
                <div key={s.label} className="bg-card p-6">
                  <Counter
                    to={s.value}
                    suffix={s.suffix}
                    className="text-3xl font-bold text-foreground"
                  />
                  <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Differentiators */}
          <Stagger className="flex flex-col gap-4">
            {values.map((v) => (
              <StaggerItem key={v.title}>
                <div className="group rounded-3xl border border-white/10 bg-card p-7 transition-all duration-300 hover:border-accent/30 hover:bg-card/80">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                      <Check className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{v.title}</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{v.description}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
