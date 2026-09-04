import { ArrowLeft } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATALOG_STATS } from "@/data/software";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogBrowser } from "@/components/software/catalog-browser";
import { CTASection } from "@/components/sections/cta-section";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Программ хангамжийн бүтэн каталог",
  description: `${CATALOG_STATS.vendors} үйлдвэрлэгчийн ${CATALOG_STATS.categories} ангиллын программ хангамж — хэрэгцээт шийдлээ хайж олоод үнийн санал аваарай.`,
  path: "/software/catalog",
  keywords: ["программ хангамжийн каталог", "лицензийн жагсаалт", "SIEM", "DLP", "XDR", "MDM"],
});

export default async function SoftwareCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        label="Бүтэн каталог"
        title={
          <>
            {CATALOG_STATS.categories} ангиллын{" "}
            <span className="text-gradient-accent">программ хангамж</span>
          </>
        }
        description={`${CATALOG_STATS.vendors} үйлдвэрлэгчийн шийдлийг ангиллаар нь эрэмбэлэв. Хэрэгцээт шийдлээ хайж олоод үнийн санал аваарай.`}
      />

      <section className="container-wide">
        <Link
          href="/software"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Программ хангамж
        </Link>
      </section>

      <section className="container-wide py-12 pb-24">
        <CatalogBrowser />
      </section>

      <CTASection />
    </>
  );
}
