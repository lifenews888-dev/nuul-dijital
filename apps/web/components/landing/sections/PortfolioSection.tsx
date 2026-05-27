import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";

type PortfolioItem = {
  title: string;
  category: string;
  description: string;
  link?: string;
  status?: "live" | "soon";
  gradient: string;
};

const items: PortfolioItem[] = [
  {
    title: "Yria.mn",
    category: "AI Чатбот платформ",
    description: "Монгол хэлтэй чатбот барих платформ. Facebook, Web, Viber-д суурилуулах.",
    link: "https://yria.mn",
    status: "live",
    gradient: "from-[#7B6FFF]/30 via-[#7B6FFF]/10 to-transparent",
  },
  {
    title: "Nuul.digital",
    category: "Агентлагийн платформ",
    description: "Маркетинг агентлагийн вэб платформ — таны үзэж буй сайт өөрөө.",
    link: "/",
    status: "live",
    gradient: "from-[#00E5B8]/30 via-[#00E5B8]/10 to-transparent",
  },
  {
    title: "BizPrint Pro",
    category: "SaaS",
    description: "Хэвлэлийн үйлчилгээний бизнесийн менежмент платформ.",
    status: "soon",
    gradient: "from-[#FFB02E]/25 via-[#FFB02E]/08 to-transparent",
  },
  {
    title: "Кофе шопын вэбсайт",
    category: "E-commerce",
    description: "Захиалга авах, QPay төлбөртэй жижиг бизнесийн вэбсайт.",
    status: "soon",
    gradient: "from-[#FF6B9D]/25 via-[#FF6B9D]/08 to-transparent",
  },
  {
    title: "Боловсролын платформ",
    category: "EdTech",
    description: "Хичээл, тестээ удирдах, төлбөр цуглуулах онлайн академи.",
    status: "soon",
    gradient: "from-[#5BA5FF]/25 via-[#5BA5FF]/08 to-transparent",
  },
  {
    title: "Танай бизнес?",
    category: "Дараагийн төсөл",
    description: "Анхны харилцагчдад тусгай үнэ. Бид таны төслийг өсгөхөд бэлэн.",
    link: "/contact",
    status: "soon",
    gradient: "from-white/15 via-white/5 to-transparent",
  },
];

function Card({ item }: { item: PortfolioItem }) {
  const inner = (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-0 transition-all hover:border-white/15 hover:bg-white/[0.04]">
      {/* Visual area */}
      <div className={`aspect-[16/10] overflow-hidden bg-gradient-to-br ${item.gradient}`}>
        <div className="flex h-full w-full items-end justify-between p-5">
          <span className="font-syne text-2xl font-normal tracking-tight text-white/80">
            {item.title}
          </span>
          {item.status === "live" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          ) : (
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Тун удахгүй
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="border-t border-white/[0.04] p-5">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-gray-500">
          {item.category}
        </div>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-400">
          {item.description}
        </p>
        {item.status === "live" && item.link && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/80 transition-colors group-hover:text-white">
            Үзэх
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
    </article>
  );

  if (item.link) {
    const external = item.link.startsWith("http");
    return (
      <Link
        href={item.link}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

export function PortfolioSection() {
  return (
    <ScrollReveal>
      <section id="work" className="relative z-[2] px-6 py-24 sm:px-12">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
          <span className="inline-block h-px w-6 bg-gray-500" />
          Хийсэн ажлууд
        </div>
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <h2
            className="font-syne text-[clamp(32px,4vw,48px)] font-normal leading-tight tracking-tight text-white"
            style={{ letterSpacing: "-0.03em" }}
          >
            Бид ингэж ажилладаг.<br />Ингэж бүтээдэг.
          </h2>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white hover:text-black"
          >
            Төсөл захиалах
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title} item={item} />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
