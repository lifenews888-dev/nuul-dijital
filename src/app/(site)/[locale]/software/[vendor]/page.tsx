import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { findVendor, categoriesForVendor } from "@/data/software";
import { getSoftwareCatalogue } from "@/lib/content";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Reveal } from "@/components/motion/reveal";
import { MediaShowcase } from "@/components/shared/media-showcase";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const { vendors } = await getSoftwareCatalogue();
  return vendors.map((v) => ({ vendor: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vendor: string }>;
}): Promise<Metadata> {
  const { vendor } = await params;
  const { vendors } = await getSoftwareCatalogue();
  const v = findVendor(vendors, vendor);
  if (!v) return {};
  return buildMetadata({
    title: `${v.name} лиценз Монголд`,
    description: v.description,
    path: `/software/${v.slug}`,
    keywords: [`${v.name} лиценз`, `${v.name} Монгол`, "программ хангамжийн лиценз"],
  });
}

export default async function SoftwareVendorPage({
  params,
}: {
  params: Promise<{ locale: string; vendor: string }>;
}) {
  const { locale, vendor } = await params;
  setRequestLocale(locale);
  const catalogue = await getSoftwareCatalogue();
  const v = findVendor(catalogue.vendors, vendor);
  if (!v) notFound();
  const categories = categoriesForVendor(catalogue.categories, v.slug);

  return (
    <>
      <PageHeader
        label={v.tagline}
        title={
          <>
            {v.name} <span className="text-gradient-accent">лиценз</span>
          </>
        }
        description={v.description}
      />

      <section className="container-wide">
        <Link
          href="/software"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Бүх үйлдвэрлэгч
        </Link>
      </section>

      <section className="container-wide py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <MediaShowcase
              image={v.image}
              gallery={v.gallery}
              videoUrl={v.videoUrl}
              title={v.name}
              className="mb-12 flex flex-col gap-5"
            />

            <h2 className="text-2xl font-bold tracking-tight">Бүтээгдэхүүн</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {v.products.map((p, i) => (
                <Reveal key={p} delay={(i % 4) * 0.04}>
                  <li className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-card px-4 py-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="text-sm text-muted-foreground">{p}</span>
                  </li>
                </Reveal>
              ))}
            </ul>

            {v.editions && (
              <>
                <h2 className="mt-14 text-2xl font-bold tracking-tight">Лицензийн хувилбар</h2>
                {/* One shared note rather than the same sentence repeated under
                    each edition — until we carry real per-edition detail, saying
                    it once reads as considered instead of padded. */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {v.editions.map((e) => (
                    <span
                      key={e}
                      className="rounded-full border border-white/10 bg-card px-4 py-2 text-sm font-medium"
                    >
                      {e}
                    </span>
                  ))}
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Хувилбарууд эрхийн түвшин, хэрэглэгчийн тоо, нэмэлт боломжоороо ялгаатай.
                  Танай багт аль нь тохирохыг үнийн саналын хамт зөвлөнө.
                </p>
              </>
            )}

            {categories.length > 0 && (
              <>
                <h2 className="mt-14 text-2xl font-bold tracking-tight">
                  Хамрах чиглэл{" "}
                  <span className="text-muted-foreground">({categories.length})</span>
                </h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/software/category/${c.slug}`}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            {v.priceMnt != null && (
              <div className="mb-5 rounded-3xl border border-accent/25 bg-accent/[0.07] p-6">
                <div className="text-3xl font-bold text-accent">
                  {v.priceMnt.toLocaleString("mn-MN")}₮
                </div>
                {v.priceNote && (
                  <p className="mt-1 text-sm text-muted-foreground">{v.priceNote}</p>
                )}
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-semibold">Хэнд тохиромжтой вэ</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.audience}</p>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Button asChild variant="gradient">
                <Link href={`/software/request?vendor=${v.slug}`}>
                  {v.name} лицензийн үнийн санал <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Зөвлөгөө авах</Link>
              </Button>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Дурдсан бүтээгдэхүүний нэр, барааны тэмдэг нь тухайн эрх эзэмшигчийн өмч юм. Nuul
              Digital нь эдгээр лицензийг албан ёсны дистрибьюторын сувгаар нийлүүлнэ.
            </p>
          </aside>
        </div>
      </section>

      <CTASection />
    </>
  );
}
