"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { testimonials as staticTestimonials } from "@/data/testimonials";
import { SectionHeading } from "@/components/shared/section-heading";

type Item = { quote: string; author: string; role: string; company: string; rating: number; avatar: string };

export function TestimonialsSection({ items }: { items?: Item[] }) {
  const tx = useTranslations("home.testimonials");
  const testimonials = items?.length ? items : staticTestimonials;
  const [index, setIndex] = useState(0);
  const t = testimonials[index % testimonials.length];
  const go = (dir: number) =>
    setIndex((i) => (i + dir + testimonials.length) % testimonials.length);

  return (
    <section className="py-24 lg:py-32">
      <div className="container-wide">
        <SectionHeading
          align="center"
          label={tx("label")}
          title={tx.rich("title", {
            accent: (c) => <span className="text-gradient-accent">{c}</span>,
          })}
        />

        <div className="relative mx-auto mt-14 max-w-4xl">
          <Quote className="absolute -top-6 left-1/2 size-16 -translate-x-1/2 text-accent/15" />
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/10 bg-card p-8 text-center sm:p-12"
            >
              <div className="flex justify-center gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="size-5 fill-accent-cyan text-accent-cyan" />
                ))}
              </div>
              <p className="mt-6 text-balance text-xl font-medium leading-relaxed sm:text-2xl">
                “{t.quote}”
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Image
                  src={t.avatar}
                  alt={t.author}
                  width={56}
                  height={56}
                  className="size-14 rounded-full object-cover ring-2 ring-accent/30"
                />
                <div className="text-left">
                  <div className="font-semibold">{t.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {t.role}, {t.company}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => go(-1)}
              aria-label={tx("prev")}
              className="flex size-11 items-center justify-center rounded-full border border-white/10 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-8 bg-accent" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              aria-label={tx("next")}
              className="flex size-11 items-center justify-center rounded-full border border-white/10 transition-colors hover:bg-white/10"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
