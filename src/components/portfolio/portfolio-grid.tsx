"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ALL = "Бүгд"; // sentinel filter value

export function PortfolioGrid({ projects }: { projects: Project[] }) {
  const t = useTranslations("pages.portfolio");
  const industries = useMemo(
    () => [ALL, ...Array.from(new Set(projects.map((p) => p.industry)))],
    [projects]
  );
  const [filter, setFilter] = useState(ALL);
  const filtered =
    filter === ALL ? projects : projects.filter((p) => p.industry === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setFilter(ind)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              filter === ind
                ? "border-accent bg-accent text-white"
                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
            )}
          >
            {ind === ALL ? t("all") : ind}
          </button>
        ))}
      </div>

      <motion.div layout className="mt-10 grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                href={`/portfolio/${p.slug}`}
                className="group block overflow-hidden rounded-3xl border border-white/10 bg-card"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent opacity-60" />
                  <div className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-colors group-hover:bg-accent">
                    <ArrowUpRight className="size-5" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{p.industry}</Badge>
                    <span className="text-xs text-muted-foreground">{p.year}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-bold">{p.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                  <div className="mt-4 flex gap-6">
                    {p.results.slice(0, 2).map((r) => (
                      <div key={r.label}>
                        <div className="font-bold text-accent-cyan">{r.value}</div>
                        <div className="text-xs text-muted-foreground">{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
