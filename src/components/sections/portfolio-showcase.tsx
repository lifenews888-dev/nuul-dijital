"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";
import { ProjectCardLink } from "@/components/portfolio/project-card-link";
import { SectionHeading } from "@/components/shared/section-heading";
import { Tilt } from "@/components/motion/tilt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Bento layout for the showcase.
 *
 * The grid is three columns and every row holds either a 2+1 pair or one
 * full-width card, so the block tiles cleanly for *any* number of projects —
 * the previous "first card full width, rest half width" rule left the right
 * half of the last row empty whenever the count was even, which is exactly what
 * the two featured projects produced.
 *
 * The wide side alternates between rows (2+1, then 1+2) so the eye zig-zags
 * down the section instead of reading two identical columns.
 */
function cellFor(index: number, total: number) {
  // An odd count can't pair up, so the odd one out spans the full row.
  if (index === total - 1 && total % 2 === 1) {
    return { span: "lg:col-span-3", wide: true, sizes: "100vw" };
  }
  const flipped = Math.floor(index / 2) % 2 === 1;
  const wide = (index % 2 === 0) !== flipped;
  return {
    span: wide ? "lg:col-span-2" : "lg:col-span-1",
    wide,
    sizes: wide ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 1024px) 100vw, 33vw",
  };
}

export function PortfolioShowcase({ projects }: { projects: Project[] }) {
  return (
    <section className="py-24 lg:py-32">
      <div className="container-wide">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            label="Бүтээлүүд"
            title={
              <>
                Үр дүнгээр ярьдаг <span className="text-gradient-accent">төслүүд</span>
              </>
            }
          />
          <Button asChild variant="outline">
            <Link href="/portfolio">
              Бүх ажил <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-14 grid auto-rows-[22rem] grid-cols-1 gap-5 sm:auto-rows-[25rem] lg:grid-cols-3">
          {projects.map((p, i) => {
            const { span, wide, sizes } = cellFor(i, projects.length);
            return (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: (i % 2) * 0.1 }}
                className={span}
              >
                <Tilt max={4} className="h-full">
                  <ProjectCardLink
                    project={p}
                    className="group relative block h-full overflow-hidden rounded-3xl border border-white/10 bg-card"
                  >
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes={sizes}
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
                    <div className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-300 group-hover:bg-accent">
                      <ArrowUpRight className="size-5" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="accent">{p.industry}</Badge>
                        <Badge>{p.year}</Badge>
                      </div>
                      <h3
                        className={cn(
                          "mt-3 font-bold tracking-tight",
                          wide ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
                        )}
                      >
                        {p.name}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                      {/* A third of a row is too narrow for three result figures
                          side by side, so the narrow cells carry the two that
                          matter most. */}
                      <div className="mt-5 flex flex-wrap gap-6">
                        {p.results.slice(0, wide ? 3 : 2).map((r) => (
                          <div key={r.label}>
                            <div className="text-xl font-bold text-accent-cyan">{r.value}</div>
                            <div className="text-xs text-muted-foreground">{r.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ProjectCardLink>
                </Tilt>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
