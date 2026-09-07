import { getTranslations } from "next-intl/server";
import { getFaqs } from "@/lib/content";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { FaqAccordion } from "./faq-accordion";

/**
 * Public FAQ section. Reads admin-managed FAQs (DB) with a curated static
 * fallback and renders an accessible accordion.
 *
 * The FAQPage JSON-LD is optional because the same eight questions appear on
 * more than one page, and only the page that is genuinely about them should
 * claim to be an FAQPage. Google stopped showing FAQ rich results in May 2026,
 * so the markup is no longer there for snippets -- it stays because Bing and
 * the answer engines still read it.
 */
export async function FaqSection({ emitJsonLd = true }: { emitJsonLd?: boolean } = {}) {
  const [faqs, t] = await Promise.all([getFaqs(), getTranslations("faq")]);
  if (!faqs.length) return null;

  return (
    <section className="py-24 lg:py-32">
      {emitJsonLd && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }}
        />
      )}
      <div className="container-wide">
        <SectionHeading
          align="center"
          label={t("label")}
          title={t.rich("title", { accent: (c) => <span className="text-gradient-accent">{c}</span> })}
          description={t("description")}
        />
        <div className="mx-auto mt-12 max-w-3xl">
          <FaqAccordion faqs={faqs} />
        </div>
      </div>
    </section>
  );
}
