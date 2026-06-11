"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { services } from "@/data/services";
import { estimateBrief, formatMnt } from "@/lib/estimate";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Онлайн төлбөр (QPay)",
  "Цаг захиалга",
  "Хэрэглэгчийн бүртгэл / нэвтрэлт",
  "Олон хэл",
  "Захиалгын систем",
];

/** Animated tugrik value that springs to `value` on change. */
function AnimatedMnt({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 90, damping: 18 });
  const text = useTransform(spring, (v) => formatMnt(v));
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  return <motion.span>{text}</motion.span>;
}

export function InstantEstimate() {
  const t = useTranslations("home.estimate");
  const [selServices, setSelServices] = useState<string[]>(["Вэб хөгжүүлэлт"]);
  const [selFeatures, setSelFeatures] = useState<string[]>([]);

  const est = useMemo(
    () => estimateBrief({ services: selServices, features: selFeatures, pages: [] }),
    [selServices, selFeatures]
  );

  const toggle = (arr: string[], set: (v: string[]) => void, item: string) =>
    set(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);

  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute left-1/2 top-1/3 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-accent/10 blur-[160px]" />
      <div className="container-wide">
        <SectionHeading
          align="center"
          label={t("label")}
          title={t.rich("title", {
            accent: (c) => <span className="text-gradient-accent">{c}</span>,
          })}
          description={t("description")}
        />

        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-card">
          <div className="grid lg:grid-cols-2">
            {/* Picker */}
            <div className="border-b border-white/10 p-7 lg:border-b-0 lg:border-r">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("servicesLabel")}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {services.map((s) => {
                  const active = selServices.includes(s.title);
                  return (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => toggle(selServices, setSelServices, s.title)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                        active
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
                      )}
                    >
                      <s.icon className={cn("size-4", active && "text-accent")} />
                      {s.title}
                    </button>
                  );
                })}
              </div>

              <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("featuresLabel")}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {FEATURES.map((f) => {
                  const active = selFeatures.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggle(selFeatures, setSelFeatures, f)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                        active
                          ? "border-accent-cyan bg-accent-cyan/10 text-foreground"
                          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
                      )}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result */}
            <div className="relative flex flex-col justify-center bg-gradient-to-br from-accent/[0.06] to-accent-cyan/[0.06] p-7">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Zap className="size-3.5" /> {t("instant")}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">{t("estimateLabel")}</div>
              <div className="mt-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent">
                  <AnimatedMnt value={est.min} />
                </span>
                <span className="mx-2 text-muted-foreground">–</span>
                <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent">
                  <AnimatedMnt value={est.max} />
                </span>
              </div>

              {/* breakdown */}
              <div className="mt-5 flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {est.items.map((it) => (
                    <motion.div
                      key={it.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="size-3.5 text-accent" />
                      {it.label}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button asChild variant="gradient" size="lg" className="mt-7 w-fit">
                <Link href="/quote">
                  <Sparkles className="size-4" /> {t("detailedQuote")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
