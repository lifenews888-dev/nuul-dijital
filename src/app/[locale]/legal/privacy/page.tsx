import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Нууцлалын бодлого", path: "/legal/privacy" });

export default async function PrivacyPage() {
  const t = await getTranslations("pages.legal");
  const sections = t.raw("privacy") as { h: string; p: string }[];
  return (
    <>
      <PageHeader label={t("label")} title={t("privacyTitle")} />
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
