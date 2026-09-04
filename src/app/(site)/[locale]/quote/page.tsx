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

function normalizeDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase()
    .trim();
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; journey?: string }>;
}) {
  const [{ domain, journey }, t] = await Promise.all([
    searchParams,
    getTranslations("pages.quote"),
  ]);

  const initial = domain
    ? { domainStatus: "HAVE" as const, domainName: normalizeDomain(domain) }
    : undefined;

  return (
    <>
      <PageHeader
        label={t("label")}
        title={t.rich("title", { accent: (c) => <span className="text-gradient-accent">{c}</span> })}
        description={t("description")}
      />
      <section className="container-wide pb-24">
        <div className="mx-auto max-w-4xl">
          <QuoteWizard initial={initial} journeyId={journey} />
        </div>
      </section>
    </>
  );
}
