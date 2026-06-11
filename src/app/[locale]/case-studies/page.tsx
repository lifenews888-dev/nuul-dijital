import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getCaseStudies } from "@/lib/content";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Кейс судалгаа",
  description: "Бодит асуудлыг хэрхэн шийдэж, хэмжигдэхүйц үр дүн авчирсан тухай дэлгэрэнгүй кейс судалгаа.",
  path: "/case-studies",
});

export default async function CaseStudiesPage() {
  const caseStudies = await getCaseStudies();
  return (
    <>
      <PageHeader
        label="Кейс судалгаа"
        title={
          <>
            Асуудлаас <span className="text-gradient-accent">үр дүн</span> хүртэл
          </>
        }
        description="Бид хэрхэн сэтгэдэг, ажилладаг, ямар үр дүн авчирдгийг дэлгэрэнгүй харуулсан түүхүүд."
      />

      <section className="container-wide pb-24">
        <div className="flex flex-col gap-8">
          {caseStudies.map((c, i) => (
            <Reveal key={c.slug}>
              <Link
                href={`/case-studies/${c.slug}`}
                className="group grid overflow-hidden rounded-3xl border border-white/10 bg-card lg:grid-cols-2"
              >
                <div className={`relative aspect-[16/10] overflow-hidden lg:aspect-auto ${i % 2 ? "lg:order-2" : ""}`}>
                  <Image
                    src={c.cover}
                    alt={c.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{c.industry}</Badge>
                    <span className="text-xs text-muted-foreground">{c.duration}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{c.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{c.excerpt}</p>
                  <div className="mt-6 flex flex-wrap gap-6">
                    {c.results.slice(0, 3).map((r) => (
                      <div key={r.label}>
                        <div className="text-2xl font-bold text-accent-cyan">{r.value}</div>
                        <div className="text-xs text-muted-foreground">{r.label}</div>
                      </div>
                    ))}
                  </div>
                  <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                    Кейс унших{" "}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <CTASection />
    </>
  );
}
