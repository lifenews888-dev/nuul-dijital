/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";

type Stack = {
  title: string;
  reason: string;
  outcome: string;
  logos: { name: string; slug: string; hex: string }[];
};

const stacks: Stack[] = [
  {
    title: "Хурдтай. Дэлхий даяар.",
    reason:
      "Сайт ачаалал 1 секундээс бага. Олон улсын CDN дээр байрлуулагдаж, Монголоос ч, гадаадаас ч ижил хурдтай нээгдэнэ.",
    outcome: "→ 99.9% uptime · <1s ачаалал",
    logos: [
      { name: "Next.js", slug: "nextdotjs", hex: "ffffff" },
      { name: "Vercel", slug: "vercel", hex: "ffffff" },
      { name: "Cloudflare", slug: "cloudflare", hex: "F38020" },
    ],
  },
  {
    title: "Найдвартай. Алдаагүй.",
    reason:
      "Хатуу типтэй TypeScript, schema-аар хамгаалагдсан DB. Алдаа production-д хүрэхгүйгээр build-эд илрэн засагдана.",
    outcome: "→ Алдааны эрсдэл хамгийн бага",
    logos: [
      { name: "TypeScript", slug: "typescript", hex: "3178C6" },
      { name: "Prisma", slug: "prisma", hex: "ffffff" },
      { name: "tRPC", slug: "trpc", hex: "398CCB" },
    ],
  },
  {
    title: "Өргөтгөгдөх. Найдвартай.",
    reason:
      "Сая хэрэглэгч даах PostgreSQL DB. Real-time, file storage, auth бүгд нэг infrastructure-аар автомат масштабалт.",
    outcome: "→ 1-ээс 1M хэрэглэгч хүртэл",
    logos: [
      { name: "PostgreSQL", slug: "postgresql", hex: "4169E1" },
      { name: "Supabase", slug: "supabase", hex: "3FCF8E" },
      { name: "Stripe", slug: "stripe", hex: "635BFF" },
    ],
  },
  {
    title: "AI-аар автоматжсан.",
    reason:
      "2025 оны хамгийн дэвшилтэт хэлний модель — Claude, GPT. Чатбот, контент, дэмжлэг бүгд AI-тай хослуулсан.",
    outcome: "→ Хариулт 4 секундад",
    logos: [
      { name: "Anthropic", slug: "anthropic", hex: "D97757" },
      { name: "Resend", slug: "resend", hex: "ffffff" },
    ],
  },
];

export function TechStandardSection() {
  return (
    <ScrollReveal>
      <section className="relative z-[2] px-6 py-24 sm:px-12">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
          <span className="inline-block h-px w-6 bg-gray-500" />
          Технологийн стандарт
        </div>
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <h2
            className="max-w-[700px] font-syne text-[clamp(32px,4vw,48px)] font-normal leading-tight tracking-tight text-white"
            style={{ letterSpacing: "-0.03em" }}
          >
            Дэлхийн стандартаар бүтсэн.<br />Монголын бизнест зориулсан.
          </h2>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white hover:text-black"
          >
            Манай арга барил
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {stacks.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-all hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div className="mb-5 flex flex-wrap gap-3">
                {s.logos.map((logo) => (
                  <div
                    key={logo.slug}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/40 px-2.5 py-1.5"
                  >
                    <img
                      src={`https://cdn.simpleicons.org/${logo.slug}/${logo.hex}`}
                      alt={logo.name}
                      width={14}
                      height={14}
                      loading="lazy"
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-medium text-white/70">
                      {logo.name}
                    </span>
                  </div>
                ))}
              </div>
              <h3
                className="mb-2 font-syne text-xl font-normal tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                {s.title}
              </h3>
              <p className="mb-4 text-[13px] leading-relaxed text-gray-400">
                {s.reason}
              </p>
              <div className="inline-flex rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-white/60">
                {s.outcome}
              </div>
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
