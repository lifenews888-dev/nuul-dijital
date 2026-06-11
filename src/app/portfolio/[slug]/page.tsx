import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import { projects, getProject } from "@/data/projects";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return buildMetadata({ title: "Олдсонгүй" });
  return buildMetadata({
    title: p.name,
    description: p.description,
    path: `/portfolio/${slug}`,
    image: p.image,
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const next = projects[(projects.findIndex((x) => x.slug === slug) + 1) % projects.length];

  return (
    <>
      <PageHeader label={p.industry} title={p.name} description={p.description} />

      <section className="container-wide pb-12">
        <Reveal>
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10">
            <Image src={p.image} alt={p.name} fill priority sizes="100vw" className="object-cover" />
          </div>
        </Reveal>
      </section>

      <section className="container-wide pb-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          {/* meta sidebar */}
          <div className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Салбар</div>
              <div className="mt-1 font-semibold">{p.industry}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Он</div>
              <div className="mt-1 font-semibold">{p.year}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Үйлчилгээ</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.services.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Технологи</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.technologies.map((t) => (
                  <Badge key={t} variant="accent">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            {p.link && (
              <Button asChild variant="outline">
                <a href={p.link} target="_blank" rel="noreferrer">
                  Вэбсайт үзэх <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </div>

          {/* content */}
          <div className="flex flex-col gap-12">
            <Reveal>
              <div>
                <h2 className="text-2xl font-bold">Үр дүн</h2>
                <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-3">
                  {p.results.map((r) => (
                    <div key={r.label} className="bg-card p-6 text-center">
                      <div className="text-3xl font-bold text-accent-cyan">{r.value}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {p.gallery.length > 0 && (
              <Reveal>
                <div className="flex flex-col gap-6">
                  {p.gallery.map((g, i) => (
                    <div
                      key={i}
                      className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10"
                    >
                      <Image
                        src={g}
                        alt={`${p.name} ${i + 1}`}
                        fill
                        sizes="100vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between border-t border-white/10 pt-8">
          <Button asChild variant="ghost">
            <Link href="/portfolio">
              <ArrowLeft className="size-4" /> Бүх ажил
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/portfolio/${next.slug}`}>
              Дараагийн төсөл <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <CTASection />
    </>
  );
}
