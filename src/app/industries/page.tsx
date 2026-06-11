import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { industries } from "@/data/industries";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Салбарууд",
  description:
    "Санхүү, жижиглэн худалдаа, эрүүл мэнд, боловсрол, логистик, төрийн байгууллага, стартап — салбар бүрт тохирсон дижитал шийдэл.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <>
      <PageHeader
        label="Салбарууд"
        title={
          <>
            Салбар бүрт <span className="text-gradient-accent">тохирсон шийдэл</span>
          </>
        }
        description="Бид салбар тус бүрийн өвөрмөц сорилтыг гүн ойлгож, түүнд тохирсон дижитал шийдлийг бүтээдэг."
      />

      <section className="container-wide pb-24">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <Reveal key={ind.slug} delay={(i % 3) * 0.06}>
              <Link
                href={`/industries/${ind.slug}`}
                className="group flex h-full flex-col rounded-3xl border border-white/10 bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <ind.icon className="size-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold">{ind.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {ind.short}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Дэлгэрэнгүй{" "}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <CTASection />
    </>
  );
}
