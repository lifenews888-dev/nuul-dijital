import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Quote } from "lucide-react";
import { caseStudies, getCaseStudy } from "@/data/case-studies";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) return buildMetadata({ title: "Олдсонгүй" });
  return buildMetadata({
    title: c.title,
    description: c.excerpt,
    path: `/case-studies/${slug}`,
    image: c.cover,
  });
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) notFound();

  return (
    <>
      <PageHeader label={`${c.client} · ${c.industry}`} title={c.title} description={c.excerpt} />

      <section className="container-wide pb-12">
        <Reveal>
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10">
            <Image src={c.cover} alt={c.title} fill priority sizes="100vw" className="object-cover" />
          </div>
        </Reveal>
        <div className="mt-6 flex flex-wrap gap-2">
          {c.services.map((s) => (
            <Badge key={s} variant="accent">
              {s}
            </Badge>
          ))}
          <Badge>Хугацаа: {c.duration}</Badge>
        </div>
      </section>

      <section className="container-wide pb-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <Reveal>
            <div>
              <h2 className="text-2xl font-bold">Сорилт</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{c.challenge}</p>
            </div>
          </Reveal>

          <Reveal>
            <div>
              <h2 className="text-2xl font-bold">Бидний хандлага</h2>
              <ul className="mt-5 flex flex-col gap-3">
                {c.approach.map((a) => (
                  <li key={a} className="flex items-start gap-3">
                    <Check className="mt-1 size-5 shrink-0 text-accent" />
                    <span className="text-lg text-muted-foreground">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal>
            <div>
              <h2 className="text-2xl font-bold">Шийдэл</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{c.solution}</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-4">
              {c.results.map((r) => (
                <div key={r.label} className="bg-card p-6 text-center">
                  <div className="text-2xl font-bold text-accent-cyan sm:text-3xl">{r.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {c.testimonial && (
            <Reveal>
              <figure className="relative rounded-3xl border border-accent/20 bg-accent/5 p-8">
                <Quote className="size-8 text-accent/40" />
                <blockquote className="mt-4 text-xl font-medium leading-relaxed">
                  “{c.testimonial.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.testimonial.author}</span> ·{" "}
                  {c.testimonial.role}
                </figcaption>
              </figure>
            </Reveal>
          )}

          <Button asChild variant="ghost" className="self-start">
            <Link href="/case-studies">
              <ArrowLeft className="size-4" /> Бүх кейс судалгаа
            </Link>
          </Button>
        </div>
      </section>

      <CTASection />
    </>
  );
}
