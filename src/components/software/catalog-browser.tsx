"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  categoriesByGroup,
  getSoftwareVendor,
  searchCatalog,
  type SoftwareCategory,
} from "@/data/software";
import { Input } from "@/components/ui/input";

function VendorChips({ vendors }: { vendors: string[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {vendors.map((slug) => (
        <span
          key={slug}
          className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-muted-foreground"
        >
          {getSoftwareVendor(slug)?.name}
        </span>
      ))}
    </span>
  );
}

function CategoryRow({ category }: { category: SoftwareCategory }) {
  return (
    <Link
      href={`/software/category/${category.slug}`}
      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03]"
    >
      <span className="text-sm font-medium text-foreground">{category.title}</span>
      <VendorChips vendors={category.vendors} />
    </Link>
  );
}

export function CatalogBrowser() {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => categoriesByGroup(), []);
  const results = useMemo(() => searchCatalog(query), [query]);
  const searching = query.trim().length >= 2;

  return (
    <div>
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Хайх — жишээ: Photoshop, антивирус, нөөцлөлт, SIEM…"
          aria-label="Каталогаас хайх"
          className="pl-11"
        />
      </div>

      {searching ? (
        <div className="mt-12 space-y-10">
          {results.vendors.length > 0 && (
            <div>
              <h2 className="section-label">
                <span className="size-1.5 rounded-full bg-accent" />
                Үйлдвэрлэгч
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {results.vendors.map((v) => (
                  <Link
                    key={v.slug}
                    href={`/software/${v.slug}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm transition-colors hover:border-white/25"
                  >
                    {v.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.categories.length > 0 && (
            <div>
              <h2 className="section-label">
                <span className="size-1.5 rounded-full bg-accent" />
                Ангилал
              </h2>
              <div className="mt-4 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-card">
                {results.categories.map((c) => (
                  <CategoryRow key={c.slug} category={c} />
                ))}
              </div>
            </div>
          )}

          {!results.vendors.length && !results.categories.length && (
            <p className="text-muted-foreground">
              Илэрц олдсонгүй. Хайж буй программаа{" "}
              <Link href="/software/request" className="text-accent underline">
                үнийн саналын форм
              </Link>{" "}
              дээр бичээрэй — каталогт байхгүй ч захиалж авах боломжтой.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-14 space-y-14">
          {groups.map((g) => (
            <section key={g.group}>
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{g.label}</h2>
                <span className="text-sm text-muted-foreground">{g.items.length} ангилал</span>
              </div>
              <div className="mt-6 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-card">
                {g.items.map((c) => (
                  <CategoryRow key={c.slug} category={c} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
