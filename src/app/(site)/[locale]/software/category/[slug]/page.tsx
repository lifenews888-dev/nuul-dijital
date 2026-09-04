import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  GROUP_LABELS,
  getSoftwareCategory,
  getSoftwareVendor,
  softwareCategories,
} from "@/data/software";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return softwareCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getSoftwareCategory(slug);
  if (!c) return {};
  const names = c.vendors
    .map((s) => getSoftwareVendor(s)?.name)
    .filter(Boolean)
    .join(", ");
  return buildMetadata({
    title: `${c.title} — лиценз Монголд`,
    description: `${c.description} Шийдлүүд: ${names}. Байгууллагын лиценз төгрөгөөр, НӨАТ-ын нэхэмжлэхтэй.`,
    path: `/software/category/${c.slug}`,
    keywords: [c.title, `${c.title} Монгол`, ...c.vendors.map((s) => getSoftwareVendor(s)?.name ?? s)],
  });
}

export default async function SoftwareCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const c = getSoftwareCategory(slug);
  if (!c) notFound();

  const vendors = c.vendors
    .map((s) => getSoftwareVendor(s))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  // Neighbours in the same group give the page somewhere to go besides "back".
  const related = softwareCategories
    .filter((x) => x.group === c.group && x.slug !== c.slug)
    .slice(0, 6);

  return (
    <>
      <PageHeader
        label={GROUP_LABELS[c.group]}
        title={c.title}
        description={c.description}
      />

      <section className="container-wide">
        <Link
          href="/software/catalog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Бүтэн каталог
        </Link>
      </section>

      <section className="container-wide py-14">
        <h2 className="text-2xl font-bold tracking-tight">
          Энэ чиглэлийн шийдлүүд{" "}
          <span className="text-muted-foreground">({vendors.length})</span>
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {vendors.map((v, i) => (
            <Reveal key={v.slug} delay={(i % 2) * 0.06}>
              <Link
                href={`/software/${v.slug}`}
                className="card-glow group flex h-full flex-col rounded-3xl border border-white/10 bg-card p-7 transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    v.accent === "cyan"
                      ? "bg-accent-cyan/10 text-accent-cyan"
                      : "bg-accent/10 text-accent"
                  )}
                >
                  <v.icon className="size-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight">{v.name}</h3>
                <p className="mt-1 text-sm font-medium text-accent">{v.tagline}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {v.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Дэлгэрэнгүй{" "}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-12">
          <Button asChild variant="gradient">
            <Link href={`/software/request?category=${c.slug}`}>
              Энэ чиглэлээр үнийн санал авах <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight">Ойролцоо чиглэлүүд</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/software/category/${r.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="mt-14 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Дурдсан бүтээгдэхүүний нэр, барааны тэмдэг нь тухайн эрх эзэмшигчийн өмч юм. Nuul
          Digital нь эдгээр лицензийг албан ёсны дистрибьюторын сувгаар нийлүүлнэ.
        </p>
      </section>

      <CTASection />
    </>
  );
}
