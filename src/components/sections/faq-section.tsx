import { getTranslations } from "next-intl/server";
import { getFaqs } from "@/lib/content";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { FaqAccordion } from "./faq-accordion";

/**
 * Public FAQ section. Reads admin-managed FAQs (DB) with a curated static
 * fallback, renders an accessible accordion, and emits FAQPage JSON-LD so the
 * answers can surface as rich results in search.
 */
export async function FaqSection() {
  const [faqs, t] = await Promise.all([getFaqs(), getTranslations("faq")]);
  if (!faqs.length) return null;

  return (
    <section className="py-24 lg:py-32">
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
