"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { ProcessStep } from "@/data/company";
import { getIcon } from "@/lib/icons";
import { SectionHeading } from "@/components/shared/section-heading";

export function ProcessSection({ steps }: { steps: ProcessStep[] }) {
  const t = useTranslations("home.process");
  return (
    <section className="relative py-24 lg:py-32">
      <div className="container-wide">
        <SectionHeading
          align="center"
          label={t("label")}
          title={t.rich("title", {
            accent: (c) => <span className="text-gradient-accent">{c}</span>,
          })}
          description={t("description")}
        />

        <div className="relative mt-16">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />
          <div className="grid gap-8 lg:grid-cols-5">
            {steps.map((s, i) => {
              const Icon = getIcon(s.icon);
              return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
              >
                <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-card text-accent shadow-lg">
                  <Icon className="size-6" />
                </div>
                <div className="mt-5 text-xs font-bold uppercase tracking-widest text-accent">
                  {s.step}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
