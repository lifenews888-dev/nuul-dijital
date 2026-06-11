import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { services, getService } from "@/data/services";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return buildMetadata({ title: "Олдсонгүй" });
  return buildMetadata({
    title: service.title,
    description: service.description,
    path: `/services/${slug}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <>
      <PageHeader label="Үйлчилгээ" title={service.title} description={service.description} />

      <section className="container-wide pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-10">
            <Reveal>
              <div>
                <h2 className="text-2xl font-bold">Бид юу хийдэг вэ</h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {service.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-card p-4"
                    >
                      <Check className="mt-0.5 size-5 shrink-0 text-accent" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal>
              <div>
                <h2 className="text-2xl font-bold">Хүлээлгэн өгөх үр дүн</h2>
                <div className="mt-6 flex flex-wrap gap-3">
                  {service.deliverables.map((d) => (
                    <span
                      key={d}
                      className="rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm font-medium text-foreground"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="lg:sticky lg:top-28">
              <div
                className={cn(
                  "rounded-3xl border border-white/10 bg-card p-8",
                  service.accent === "cyan" ? "shadow-accent-cyan/5" : ""
                )}
              >
                <div
                  className={cn(
                    "flex size-14 items-center justify-center rounded-2xl",
                    service.accent === "cyan"
                      ? "bg-accent-cyan/10 text-accent-cyan"
                      : "bg-accent/10 text-accent"
                  )}
                >
                  <service.icon className="size-7" />
                </div>
                <h3 className="mt-6 text-xl font-bold">Энэ үйлчилгээг сонирхож байна уу?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Үнэ төлбөргүй зөвлөгөө аваад, төслийнхөө хүрээг тодорхойлоорой.
                </p>
                <Button asChild variant="gradient" className="mt-6 w-full">
                  <Link href="/quote">
                    Үнийн санал авах <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="mt-2 w-full">
                  <Link href="/contact">Холбоо барих</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-20">
          <h2 className="text-xl font-bold">Бусад үйлчилгээ</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/services/${o.slug}`}
                className="group rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-white/20"
              >
                <o.icon className="size-6 text-accent" />
                <div className="mt-3 font-semibold">{o.title}</div>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-accent">
                  Үзэх <ArrowRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <Button asChild variant="ghost">
            <Link href="/services">
              <ArrowLeft className="size-4" /> Бүх үйлчилгээ
            </Link>
          </Button>
        </div>
      </section>

      <CTASection />
    </>
  );
}
