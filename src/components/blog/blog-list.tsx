"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { Post } from "@/data/posts";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, cn } from "@/lib/utils";

export function BlogList({ posts }: { posts: Post[] }) {
  const [cat, setCat] = useState("Бүгд");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const categories = useMemo(
    () => ["Бүгд", ...Array.from(new Set(posts.map((p) => p.category)))],
    [posts]
  );

  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((p) => p.tags))).slice(0, 12),
    [posts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesCat = cat === "Бүгд" || p.category === cat;
      const matchesTag = !tag || p.tags.includes(tag);
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesTag && matchesQuery;
    });
  }, [cat, query, tag, posts]);

  return (
    <div>
      {/* Search + categories */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                cat === c
                  ? "border-accent bg-accent text-white"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Нийтлэл хайх..."
            className="pl-10"
            aria-label="Нийтлэл хайх"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {allTags.map((t) => (
          <button
            key={t}
            onClick={() => setTag(tag === t ? null : t)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              tag === t
                ? "border-accent bg-accent/10 text-accent"
                : "border-white/10 text-muted-foreground hover:text-foreground"
            )}
          >
            #{t}
          </button>
        ))}
        {tag && (
          <button
            onClick={() => setTag(null)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" /> Цэвэрлэх
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          “{query}” хайлтад тохирох нийтлэл олдсонгүй.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <motion.article
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
            >
              <Link
                href={`/blog/${p.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-card"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={p.cover}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="accent">{p.category}</Badge>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-accent" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-snug">{p.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">
                    {p.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{p.author}</span>
                    <span>·</span>
                    <time>{formatDate(p.date)}</time>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
