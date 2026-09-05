import { ArrowLeft } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { catalogueStats } from "@/data/software";
import { getSoftwareCatalogue } from "@/lib/content";
import { PageHeader } from "@/components/shared/page-header";
import { CatalogBrowser } from "@/components/software/catalog-browser";
import { CTASection } from "@/components/sections/cta-section";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Программ хангамжийн бүтэн каталог",
  description:
    "Байгууллагын программ хангамжийн бүтэн каталог — хэрэгцээт шийдлээ хайж олоод үнийн санал аваарай.",
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
  const catalogue = await getSoftwareCatalogue();
  const stats = catalogueStats(catalogue);

  return (
    <>
      <PageHeader
        label="Бүтэн каталог"
        title={
          <>
            {stats.categories} ангиллын{" "}
            <span className="text-gradient-accent">программ хангамж</span>
          </>
        }
        description={`${stats.vendors} үйлдвэрлэгчийн шийдлийг ангиллаар нь эрэмбэлэв. Хэрэгцээт шийдлээ хайж олоод үнийн санал аваарай.`}
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
        <CatalogBrowser catalogue={catalogue} />
      </section>

      <CTASection />
    </>
  );
}
