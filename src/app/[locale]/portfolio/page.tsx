import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { CTASection } from "@/components/sections/cta-section";
import { getProjects } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Портфолио",
  description: "Nuul Digital-ийн амжилттай хэрэгжүүлсэн төслүүд — салбар бүрт хэмжигдэхүйц үр дүн.",
  path: "/portfolio",
});

export default async function PortfolioPage() {
  const [projects, t] = await Promise.all([getProjects(), getTranslations("pages.portfolio")]);
  return (
    <>
      <PageHeader
        label={t("label")}
        title={t.rich("title", { accent: (c) => <span className="text-gradient-accent">{c}</span> })}
        description={t("description")}
      />
      <section className="container-wide pb-24">
        <PortfolioGrid projects={projects} />
      </section>
      <CTASection />
    </>
  );
}
