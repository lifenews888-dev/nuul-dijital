import { PageHeader } from "@/components/shared/page-header";
import { QuoteWizard } from "@/components/forms/quote-wizard";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Үнийн санал авах",
  description:
    "Төслийнхөө мэдээллийг хэдхэн алхамд дэлгэрэнгүй бөглөөрэй. Бид брифээр тань загвар сайт бэлтгэж, 24 цагийн дотор холбогдоно.",
  path: "/quote",
});

export default function QuotePage() {
  return (
    <>
      <PageHeader
        label="Үнийн санал / Төслийн бриф"
        title={
          <>
            Төслөө <span className="text-gradient-accent">амьд болгоё</span>
          </>
        }
        description="Хэдхэн алхамд төслийнхөө дэлгэрэнгүй мэдээллийг бөглөөрэй — үйлчилгээ, домэйн, хуудас, функц, төсөв. Бид судлаад загвар сайт бэлтгэж, 24 цагийн дотор тодорхой саналаар холбогдоно."
      />
      <section className="container-wide pb-24">
        <div className="mx-auto max-w-4xl">
          <QuoteWizard />
        </div>
      </section>
    </>
  );
}
