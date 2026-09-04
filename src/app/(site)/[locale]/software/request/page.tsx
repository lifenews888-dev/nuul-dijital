import { PageHeader } from "@/components/shared/page-header";
import { SoftwareQuoteForm } from "@/components/software/software-quote-form";
import { buildMetadata } from "@/lib/seo";

// Reads ?vendor= to preselect the manufacturer, so this page renders per request.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Лицензийн үнийн санал",
  description:
    "Байгууллагын программ хангамжийн лицензийн үнийн санал хүсэх. 24 цагийн дотор албан ёсны санал илгээнэ.",
  path: "/software/request",
});

export default async function SoftwareRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string }>;
}) {
  const { vendor } = await searchParams;

  return (
    <>
      <PageHeader
        label="Үнийн санал"
        title={
          <>
            Лицензийн <span className="text-gradient-accent">үнийн санал</span>
          </>
        }
        description="Хэрэгцээгээ бөглөнө үү. 24 цагийн дотор бичгээр албан ёсны санал илгээнэ. Зөвлөгөө үнэ төлбөргүй."
      />

      <section className="container-wide pb-24">
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-card p-8 sm:p-10">
          <SoftwareQuoteForm vendor={vendor} />
        </div>
      </section>
    </>
  );
}
