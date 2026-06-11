import Link from "next/link";
import { ArrowRight, MapPin, Briefcase, Check } from "lucide-react";
import { jobs, perks } from "@/data/jobs";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Ажлын байр",
  description: "Nuul Digital-д нэгдээрэй. Олон улсын түвшний төсөл, чадварлаг баг, хөгжих боломж.",
  path: "/careers",
});

export default function CareersPage() {
  return (
    <>
      <PageHeader
        label="Ажлын байр"
        title={
          <>
            Ирээдүйг бидэнтэй хамт <span className="text-gradient-accent">бүтээ</span>
          </>
        }
        description="Бид авьяаслаг, тууштай, шинийг эрэлхийлэгч хүмүүсийг багтаа урьж байна."
      />

      {/* Perks */}
      <section className="container-wide py-12">
        <Reveal>
          <h2 className="text-2xl font-bold">Яагаад Nuul Digital гэж?</h2>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perks.map((perk, i) => (
            <Reveal key={perk} delay={(i % 3) * 0.05}>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-card p-5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Check className="size-5" />
                </div>
                <span className="font-medium">{perk}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Open roles */}
      <section className="container-wide py-12 pb-24">
        <h2 className="text-2xl font-bold">Нээлттэй ажлын байр</h2>
        <div className="mt-6 flex flex-col gap-4">
          {jobs.map((job) => (
            <Reveal key={job.slug}>
              <Link
                href={`/careers/${job.slug}`}
                className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-card p-6 transition-all duration-300 hover:border-white/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{job.department}</Badge>
                    <Badge>{job.level}</Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-bold">{job.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="size-4" /> {job.type}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
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
