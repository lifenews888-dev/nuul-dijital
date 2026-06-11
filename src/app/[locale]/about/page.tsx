import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Counter } from "@/components/motion/counter";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { stats, values } from "@/data/company";
import { getTeam } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Бидний тухай",
  description:
    "Nuul Digital бол Монголын байгууллагуудын дижитал шилжилтийг түргэсгэдэг, чанар, үр дүнд тулгуурласан орчин үеийн агентлаг.",
  path: "/about",
});

export default async function AboutPage() {
  const team = await getTeam();
  return (
    <>
      <PageHeader
        label="Бидний тухай"
        title={
          <>
            Монголын дижитал ирээдүйг <span className="text-gradient-accent">бүтээгчид</span>
          </>
        }
        description="Бид технологи, дизайн, стратегийн чадварыг нэгтгэн, Монголын бизнесүүдийг дэлхийн жишигт хүргэх зорилготой."
      />

      {/* Mission */}
      <section className="container-wide py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="text-display-lg font-bold tracking-tight">
              Бидний <span className="text-gradient-accent">эрхэм зорилго</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col gap-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                2018 онд үүсгэн байгуулагдсан цагаасаа хойш бид 120 гаруй төслийг амжилттай
                хэрэгжүүлж, Монголын олон салбарын тэргүүлэх байгууллагуудын дижитал түнш болсон.
              </p>
              <p>
                Бид зүгээр л вэбсайт, апп хийдэггүй. Бид бизнесийн бодит асуудлыг технологийн
                ухаалаг шийдлээр шийдэж, хэмжигдэхүйц өсөлтийг бий болгодог.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="container-wide py-12">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card p-8 text-center">
              <Counter to={s.value} suffix={s.suffix} className="text-4xl font-bold" />
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="container-wide py-16">
        <Reveal>
          <h2 className="text-display-lg font-bold tracking-tight">Бидний үнэт зүйлс</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
          {values.map((v) => (
            <StaggerItem key={v.title}>
              <div className="h-full rounded-3xl border border-white/10 bg-card p-8">
                <h3 className="text-xl font-semibold">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{v.description}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Team */}
      <section className="container-wide py-16">
        <Reveal>
          <h2 className="text-display-lg font-bold tracking-tight">
            Манай <span className="text-gradient-accent">баг</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Дизайнер, инженер, стратегичдийн чадварлаг баг таны төслийн ард зогсоно.
          </p>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {team.map((m) => (
            <StaggerItem key={m.name}>
              <div className="group text-center">
                <div className="relative mx-auto aspect-square overflow-hidden rounded-3xl border border-white/10">
                  <Image
                    src={m.avatar}
                    alt={m.name}
                    fill
                    sizes="200px"
                    className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                  />
                </div>
                <div className="mt-4 font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.role}</div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <CTASection />
    </>
  );
}
