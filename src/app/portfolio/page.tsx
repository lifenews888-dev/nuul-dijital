import { PageHeader } from "@/components/shared/page-header";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { CTASection } from "@/components/sections/cta-section";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Портфолио",
  description: "Nuul Digital-ийн амжилттай хэрэгжүүлсэн төслүүд — салбар бүрт хэмжигдэхүйц үр дүн.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        label="Портфолио"
        title={
          <>
            Бидний <span className="text-gradient-accent">бүтээлүүд</span>
          </>
        }
        description="Салбар бүрт хэмжигдэхүйц үр дүн авчирсан төслүүдтэй танилцаарай."
      />
      <section className="container-wide pb-24">
        <PortfolioGrid />
      </section>
      <CTASection />
    </>
  );
}
