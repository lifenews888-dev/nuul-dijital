import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from "lucide-react";
import { industries, getIndustry } from "@/data/industries";
import { getProject } from "@/data/projects";
import { getCaseStudy } from "@/data/case-studies";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return industries.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) return buildMetadata({ title: "Олдсонгүй" });
  return buildMetadata({ title: ind.name, description: ind.description, path: `/industries/${slug}` });
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) notFound();

  const projects = ind.projectSlugs.map(getProject).filter(Boolean);
  const cases = ind.caseStudySlugs.map(getCaseStudy).filter(Boolean);

  return (
    <>
      <PageHeader label="Салбар" title={ind.name} description={ind.description} />

      <section className="container-wide pb-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-white/10 bg-card p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <AlertTriangle className="size-5 text-warning" /> Нийтлэг сорилтууд
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                {ind.challenges.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-3xl border border-white/10 bg-card p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Check className="size-5 text-success" /> Бидний шийдэл
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {ind.solutions.map((s) => (
                  <Badge key={s} variant="accent">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {(projects.length > 0 || cases.length > 0) && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold">Энэ салбарын ажлууд</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <Link
                  key={p!.slug}
                  href={`/portfolio/${p!.slug}`}
                  className="group rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-white/20"
                >
                  <Badge>{p!.industry}</Badge>
                  <div className="mt-3 text-lg font-semibold">{p!.name}</div>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-accent">
                    Төсөл үзэх <ArrowRight className="size-3" />
                  </span>
                </Link>
              ))}
              {cases.map((c) => (
                <Link
                  key={c!.slug}
                  href={`/case-studies/${c!.slug}`}
                  className="group rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-white/20"
                >
                  <Badge variant="cyan">Кейс судалгаа</Badge>
                  <div className="mt-3 text-lg font-semibold">{c!.title}</div>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-accent">
                    Кейс унших <ArrowRight className="size-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Button asChild variant="ghost" className="mt-12">
          <Link href="/industries">
            <ArrowLeft className="size-4" /> Бүх салбар
          </Link>
        </Button>
      </section>

      <CTASection />
    </>
  );
}
