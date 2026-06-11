"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { featuredProjects } from "@/data/projects";
import { SectionHeading } from "@/components/shared/section-heading";
import { Tilt } from "@/components/motion/tilt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PortfolioShowcase() {
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

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {featuredProjects.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (i % 2) * 0.1 }}
              className={i === 0 ? "lg:col-span-2" : ""}
            >
              <Tilt max={4}>
              <Link
                href={`/portfolio/${p.slug}`}
                className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-card"
              >
                <div className={`relative overflow-hidden ${i === 0 ? "aspect-[16/8]" : "aspect-[16/10]"}`}>
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                  <div className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-300 group-hover:bg-accent">
                    <ArrowUpRight className="size-5" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{p.industry}</Badge>
                    <Badge>{p.year}</Badge>
                  </div>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{p.name}</h3>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-6">
                    {p.results.slice(0, 3).map((r) => (
                      <div key={r.label}>
                        <div className="text-xl font-bold text-accent-cyan">{r.value}</div>
                        <div className="text-xs text-muted-foreground">{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
              </Tilt>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
