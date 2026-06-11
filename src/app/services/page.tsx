import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { services } from "@/data/services";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { ProcessSection } from "@/components/sections/process-section";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Үйлчилгээ",
  description:
    "Вэб хөгжүүлэлт, AI чатбот, автоматжуулалт, e-commerce, мобайл апп, дизайн, брэндинг, cloud болон дижитал маркетингийн цогц үйлчилгээ.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        label="Үйлчилгээ"
        title={
          <>
            Таны бизнест хэрэгтэй <span className="text-gradient-accent">бүх дижитал чадвар</span>
          </>
        }
        description="Стратегиас эхлээд хэрэгжүүлэлт хүртэл — нэг багтай, нэг стандартаар."
      />

      <section className="container-wide pb-24">
        <div className="grid gap-5 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 2) * 0.06}>
              <Link
                href={`/services/${s.slug}`}
                className="card-glow group flex h-full flex-col rounded-3xl border border-white/10 bg-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className={cn(
                    "flex size-14 items-center justify-center rounded-2xl",
                    s.accent === "cyan"
                      ? "bg-accent-cyan/10 text-accent-cyan"
                      : "bg-accent/10 text-accent"
                  )}
                >
                  <s.icon className="size-7" />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{s.description}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {s.features.slice(0, 3).map((f) => (
                    <li
                      key={f}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Дэлгэрэнгүй <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <ProcessSection />
      <CTASection />
    </>
  );
}
