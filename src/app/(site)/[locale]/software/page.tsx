import { ArrowRight, BadgeCheck, Coins, Headphones, ScanSearch } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  CATALOG_STATS,
  featuredCategories,
  softwareVendors,
  vendorCoverage,
  vendorsByFocus,
} from "@/data/software";
import { PageHeader } from "@/components/shared/page-header";
import { CTASection } from "@/components/sections/cta-section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Программ хангамжийн лиценз",
  description: `Adobe, Microsoft, Autodesk, Kaspersky болон ${CATALOG_STATS.vendors} үйлдвэрлэгчийн ${CATALOG_STATS.categories} ангиллын программ хангамжийн лиценз — төгрөгөөр, НӨАТ-ын нэхэмжлэхтэй.`,
  path: "/software",
  keywords: [
    "Adobe лиценз Монгол",
    "Photoshop лиценз",
    "Microsoft 365 Монгол",
    "AutoCAD лиценз",
    "Kaspersky лиценз",
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

  const groups = vendorsByFocus();
  const featured = featuredCategories();

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
        description={`${CATALOG_STATS.vendors} үйлдвэрлэгчийн ${CATALOG_STATS.categories} ангиллын программ хангамжийг албан ёсны дистрибьюторын сувгаар нийлүүлнэ. Гадаад карт, валютын хүндрэлгүй — монгол нэхэмжлэх, монгол дэмжлэг.`}
      />

      <section className="container-wide">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="gradient">
            <Link href="/software/request">
              Үнийн санал авах <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/software/catalog">Бүтэн каталог үзэх</Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [String(CATALOG_STATS.vendors), "үйлдвэрлэгч"],
            [String(CATALOG_STATS.categories), "бүтээгдэхүүний ангилал"],
            ["24 цаг", "үнийн саналын хугацаа"],
            ["₮ + НӨАТ", "монгол нэхэмжлэх"],
          ].map(([n, l], i) => (
            <Reveal key={l} delay={(i % 4) * 0.05}>
              <div className="rounded-3xl border border-white/10 bg-card p-6">
                <div className="text-2xl font-bold text-accent sm:text-3xl">{n}</div>
                <div className="mt-1 text-sm text-muted-foreground">{l}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-wide py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.05}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-6">
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-display-lg font-bold tracking-tight">Үйлдвэрлэгчид</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Хэрэгцээт программаа сонгоод үнийн санал аваарай.
            </p>
          </div>
          <Link
            href="/software/catalog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
          >
            Бүтэн каталог <ArrowRight className="size-4" />
          </Link>
        </div>

        {groups.map((group) => (
          <div key={group.focus} className="mt-12">
            <h3 className="section-label">
              <span className="size-1.5 rounded-full bg-accent" />
              {group.label}
            </h3>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((v, i) => (
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
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground">
                        {vendorCoverage(v.slug)} ангилал
                      </span>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <h4 className="text-xl font-bold tracking-tight">{v.name}</h4>
                      {v.featured && <Badge variant="accent">Түгээмэл</Badge>}
                    </div>
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
          </div>
        ))}
      </section>

      <section className="container-wide py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-display-lg font-bold tracking-tight">Хэрэгцээгээрээ сонгох</h2>
          <Link
            href="/software/catalog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
          >
            {CATALOG_STATS.categories} ангилал бүгд <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {featured.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 4) * 0.05}>
              <Link
                href={`/software/category/${c.slug}`}
                className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/25"
              >
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.vendors.map((slug) => (
                    <span
                      key={slug}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {softwareVendors.find((v) => v.slug === slug)?.name}
                    </span>
                  ))}
                </div>
              </Link>
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
