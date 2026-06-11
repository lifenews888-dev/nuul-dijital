"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { services } from "@/data/services";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

export function ServicesSection() {
  const t = useTranslations("home.services");
  return (
    <section id="services" className="relative py-24 lg:py-32">
      <div className="container-wide">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            label={t("label")}
            title={t.rich("title", {
              accent: (c) => <span className="text-gradient-accent">{c}</span>,
            })}
            description={t("description")}
          />
        </div>

        <div className="mt-14 grid auto-rows-[200px] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const big = s.featured;
            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}
                onMouseMove={(e) => {
                  const el = e.currentTarget;
                  const r = el.getBoundingClientRect();
                  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
                  el.style.setProperty("--my", `${e.clientY - r.top}px`);
                }}
                className={cn(
                  "card-glow group flex flex-col justify-between rounded-3xl border border-white/10 bg-card p-6 transition-all duration-500 hover:border-white/20 hover:-translate-y-1",
                  big && "md:col-span-2 md:row-span-1"
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl transition-colors",
                      s.accent === "cyan"
                        ? "bg-accent-cyan/10 text-accent-cyan"
                        : "bg-accent/10 text-accent"
                    )}
                  >
                    <s.icon className="size-6" />
                  </div>
                  <Link
                    href={`/services/${s.slug}`}
                    aria-label={s.title}
                    className="flex size-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-white/10 hover:text-foreground"
                  >
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {s.short}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
