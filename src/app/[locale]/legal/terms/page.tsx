import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Үйлчилгээний нөхцөл", path: "/legal/terms" });

export default async function TermsPage() {
  const t = await getTranslations("pages.legal");
  const sections = t.raw("terms") as { h: string; p: string }[];
  return (
    <>
      <PageHeader label={t("label")} title={t("termsTitle")} />
      <section className="container-wide pb-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-xl font-bold">{s.h}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{s.p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
