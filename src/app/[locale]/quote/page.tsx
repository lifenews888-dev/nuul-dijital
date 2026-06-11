import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteWizard } from "@/components/forms/quote-wizard";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Үнийн санал авах",
  description:
    "Төслийнхөө мэдээллийг хэдхэн алхамд дэлгэрэнгүй бөглөөрэй. Бид брифээр тань загвар сайт бэлтгэж, 24 цагийн дотор холбогдоно.",
  path: "/quote",
});

export default async function QuotePage() {
  const t = await getTranslations("pages.quote");
  return (
    <>
      <PageHeader
        label={t("label")}
        title={t.rich("title", { accent: (c) => <span className="text-gradient-accent">{c}</span> })}
        description={t("description")}
      />
      <section className="container-wide pb-24">
        <div className="mx-auto max-w-4xl">
          <QuoteWizard />
        </div>
      </section>
    </>
  );
}
