import { ArrowRight, BadgeCheck, Coins, Headphones, ScanSearch } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { softwareVendors, softwareCategories } from "@/data/software";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Программ хангамжийн лиценз",
  description:
    "Adobe, Microsoft, Autodesk, Kaspersky зэрэг байгууллагын программ хангамжийн лицензийг албан ёсны дистрибьюторын сувгаар — төгрөгөөр, НӨАТ-ын нэхэмжлэхтэй.",
  path: "/software",
  keywords: [
    "Adobe лиценз Монгол",
    "Photoshop лиценз",
    "Microsoft 365 Монгол",
    "AutoCAD лиценз",
    "программ хангамжийн лиценз",
    "НӨАТ-тай нэхэмжлэх",
  ],
});

const BENEFITS = [
  { icon: Coins, title: "Төгрөгөөр төлнө", desc: "Гадаад карт, валютын хөрвүүлэлт шаардлагагүй." },
  { icon: BadgeCheck, title: "НӨАТ-ын нэхэмжлэх", desc: "Дүгнэлэн бодох бүртгэлд ордог албан ёсны баримт." },
  { icon: Headphones, title: "Монгол дэмжлэг", desc: "Асуудал гарвал монгол хэлээр, монгол цагаар." },
  { icon: ScanSearch, title: "Сунгалтын сануулга", desc: "Дуусах хугацааг бид хянаж, урьдчилан сануулна." },
];

const STEPS = [
  ["01", "Хэрэгцээгээ хэлнэ", "Хэдэн хэрэглэгч, ямар программ, ямар хугацаанд."],
  ["02", "Үнийн санал", "24 цагийн дотор бичгээр албан ёсны санал илгээнэ."],
  ["03", "Гэрээ, нэхэмжлэх", "НӨАТ-ын нэхэмжлэх, төгрөгөөр төлбөр."],
  ["04", "Идэвхжүүлэлт", "Лиценз идэвхжиж, ажилтнууд тань ашиглаж эхэлнэ."],
];

export default async function SoftwarePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        label="Программ хангамжийн лиценз"
        title={
          <>
            Байгууллагын лицензийг{" "}
            <span className="text-gradient-accent">төгрөгөөр, нэхэмжлэхтэй</span>
          </>
        }
        description="Adobe, Microsoft, Autodesk, Kaspersky болон бусад үйлдвэрлэгчийн лицензийг албан ёсны дистрибьюторын сувгаар нийлүүлнэ. Гадаад карт, валютын хүндрэлгүй — монгол нэхэмжлэх, монгол дэмжлэг."
      />

      <section className="container-wide">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="gradient">
            <Link href="/software/request">
              Үнийн санал авах <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Зөвлөгөө авах</Link>
          </Button>
        </div>
      </section>

      <section className="container-wide py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.05}>
              <div className="h-full rounded-3xl border border-white/10 bg-card p-6">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <b.icon className="size-5" />
                </div>
                <h3 className="mt-5 font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-wide pb-8">
        <h2 className="text-display-lg font-bold tracking-tight">Үйлдвэрлэгчид</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Хэрэгцээт программаа сонгоод үнийн санал аваарай.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {softwareVendors.map((v, i) => (
            <Reveal key={v.slug} delay={(i % 3) * 0.06}>
              <Link
                href={`/software/${v.slug}`}
                className="card-glow group flex h-full flex-col rounded-3xl border border-white/10 bg-card p-7 transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl",
                      v.accent === "cyan"
                        ? "bg-accent-cyan/10 text-accent-cyan"
                        : "bg-accent/10 text-accent"
                    )}
                  >
                    <v.icon className="size-6" />
                  </div>
                  {v.featured && <Badge variant="accent">Түгээмэл</Badge>}
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight">{v.name}</h3>
                <p className="mt-1 text-sm font-medium text-accent">{v.tagline}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {v.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Дэлгэрэнгүй{" "}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-wide py-16">
        <h2 className="text-display-lg font-bold tracking-tight">Хэрэгцээгээрээ сонгох</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {softwareCategories.map((c, i) => (
            <Reveal key={c.key} delay={(i % 3) * 0.06}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-accent-cyan/10 text-accent-cyan">
                  <c.icon className="size-5" />
                </div>
                <h3 className="mt-5 font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.vendors.map((slug) => (
                    <Link
                      key={slug}
                      href={`/software/${slug}`}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
                    >
                      {softwareVendors.find((v) => v.slug === slug)?.name}
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-wide pb-24">
        <h2 className="text-display-lg font-bold tracking-tight">Хэрхэн ажилладаг вэ</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([n, title, desc], i) => (
            <Reveal key={n} delay={(i % 4) * 0.05}>
              <div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-accent font-bold text-white">
                  {n}
                </div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-12 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Дурдсан бүтээгдэхүүний нэр, барааны тэмдэг нь тухайн эрх эзэмшигчийн өмч юм. Nuul
          Digital нь эдгээр лицензийг албан ёсны дистрибьюторын сувгаар нийлүүлнэ.
        </p>
      </section>

      <CTASection />
    </>
  );
}
