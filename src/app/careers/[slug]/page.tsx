import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase, Check, Mail } from "lucide-react";
import { getJobs } from "@/lib/content";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export async function generateStaticParams() {
  const jobs = await getJobs();
  return jobs.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = (await getJobs()).find((j) => j.slug === slug);
  if (!job) return buildMetadata({ title: "Олдсонгүй" });
  return buildMetadata({ title: job.title, description: job.summary, path: `/careers/${slug}` });
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = (await getJobs()).find((j) => j.slug === slug);
  if (!job) notFound();

  return (
    <>
      <PageHeader label={job.department} title={job.title} description={job.summary} />

      <section className="container-wide pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-10">
            <Reveal>
              <div>
                <h2 className="text-2xl font-bold">Хариуцах ажил</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {job.responsibilities.map((r) => (
                    <li key={r} className="flex items-start gap-3">
                      <Check className="mt-1 size-5 shrink-0 text-accent" />
                      <span className="text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal>
              <div>
                <h2 className="text-2xl font-bold">Тавигдах шаардлага</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {job.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-3">
                      <Check className="mt-1 size-5 shrink-0 text-accent-cyan" />
                      <span className="text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="lg:sticky lg:top-28">
              <div className="rounded-3xl border border-white/10 bg-card p-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="size-4 text-accent" /> {job.location}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="size-4 text-accent" /> {job.type} · {job.level}
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-bold">Хүсэлт илгээх</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  CV болон портфолиогоо доорх хаягаар илгээнэ үү.
                </p>
                <Button asChild variant="gradient" className="mt-5 w-full">
                  <a
                    href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(
                      `Анкет: ${job.title}`
                    )}`}
                  >
                    <Mail className="size-4" /> Анкет илгээх
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>

        <Button asChild variant="ghost" className="mt-12">
          <Link href="/careers">
            <ArrowLeft className="size-4" /> Бүх ажлын байр
          </Link>
        </Button>
      </section>
    </>
  );
}
