"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TextReveal } from "@/components/motion/text-reveal";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Aurora } from "@/components/motion/aurora";
import { Magnetic } from "@/components/motion/magnetic";
import { stats } from "@/data/company";

export function Hero() {
  const t = useTranslations("home.hero");
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 noise">
      <GradientMesh />
      <Aurora />

      <div className="container-wide relative">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">
              <Sparkles className="size-3.5 text-accent" />
              {t("badge")}
            </span>
          </motion.div>

          <h1 className="mt-8 text-display-2xl font-extrabold leading-[0.95] tracking-tight">
            <TextReveal text={t("title1")} className="block text-foreground" />
            <span className="block">
              <TextReveal text={t("title2")} className="text-gradient-accent" delay={0.2} />
            </span>
            <TextReveal text={t("title3")} className="block text-foreground" delay={0.4} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Magnetic>
              <Button asChild variant="gradient" size="lg">
                <Link href="/quote">
                  {t("startProject")} <ArrowRight className="size-5" />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild variant="outline" size="lg">
              <Link href="/portfolio">
                <Play className="size-4" /> {t("viewWork")}
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-card/50 p-6 text-center backdrop-blur">
              <div className="text-3xl font-bold text-foreground sm:text-4xl">
                {s.value}
                <span className="text-accent">{s.suffix}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 lg:block"
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/20 p-1.5">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="size-1.5 rounded-full bg-accent"
          />
        </div>
      </motion.div>
    </section>
  );
}
