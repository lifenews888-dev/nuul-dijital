import { ScrollReveal } from "@/components/scroll-reveal";
import { prisma } from "@/lib/prisma";

type Testimonial = {
  id: string;
  text: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  rating: number;
};

const COLORS: Record<string, { avBg: string; avColor: string; avBorder: string }> = {
  violet: { avBg: "#7B6FFF22", avColor: "#A89FFF", avBorder: "#7B6FFF30" },
  teal:   { avBg: "#00E5B815", avColor: "#00E5B8", avBorder: "#00E5B825" },
  amber:  { avBg: "#FFB02E18", avColor: "#FFB02E", avBorder: "#FFB02E25" },
  pink:   { avBg: "#FF6B9D18", avColor: "#FF6B9D", avBorder: "#FF6B9D25" },
  blue:   { avBg: "#5BA5FF18", avColor: "#5BA5FF", avBorder: "#5BA5FF25" },
};

const FALLBACK: Testimonial[] = [
  {
    id: "fallback-1",
    text: "10 минутад вэбсайтаа бэлэн болголоо. Домэйноосоо чатбот хүртэл нэг дороос шийдсэн нь маш хялбар байлаа. Өмнө нь ингэж хялбар байх юм гэж бодоогүй.",
    name: "Батбаяр Д.",
    role: "Кофе шоп эзэн",
    avatar: "Б",
    color: "violet",
    rating: 5,
  },
  {
    id: "fallback-2",
    text: "Өмнө нь 3 компанид төлж байсан. Nuul нэг төлбөрт бүгдийг оруулж өгсөн. Сарын зардал 40% буурсан. Хамгийн сайн шийдвэрүүдийн нэг болсон.",
    name: "Номин Г.",
    role: "Онлайн дэлгүүр",
    avatar: "Н",
    color: "teal",
    rating: 5,
  },
  {
    id: "fallback-3",
    text: "AI чатбот маань 24/7 хариулж байна. Ажилтангүйгээр хоногт 50+ хэрэглэгчтэй харилцдаг болсон. Орлого 30% өссөн.",
    name: "Энхбаяр С.",
    role: "Маркетинг агентлаг",
    avatar: "Э",
    color: "amber",
    rating: 5,
  },
];

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return rows.length > 0 ? rows : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export async function TestimonialsSection() {
  const items = await getTestimonials();

  return (
    <ScrollReveal>
      <section id="testi" className="relative z-[2] px-6 py-24 sm:px-12">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
          <span className="inline-block h-px w-6 bg-gray-500" />
          Харилцагчид
        </div>
        <h2 className="mb-10 font-syne text-[clamp(32px,4vw,48px)] font-normal leading-tight tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>
          Тэд Nuul-ийг ашиглаж байна
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((t) => {
            const c = COLORS[t.color] ?? COLORS.violet;
            return (
              <div
                key={t.id}
                className="group relative overflow-hidden rounded-2xl border border-[--bd] bg-bg-2 p-7 transition-all hover:-translate-y-0.5 hover:border-[--bdv]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[--bdv] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-3.5 flex gap-1">
                  {Array(t.rating ?? 5)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="h-3 w-3 rounded-[3px] bg-gradient-to-br from-t to-t-dark"
                      />
                    ))}
                </div>
                <div className="mb-3 font-serif text-3xl leading-none text-[--bdv]">
                  &ldquo;
                </div>
                <p className="mb-5 text-[13px] leading-relaxed text-txt-2">
                  {t.text}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                    style={{
                      background: c.avBg,
                      color: c.avColor,
                      borderColor: c.avBorder,
                    }}
                  >
                    {t.avatar || t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{t.name}</div>
                    <div className="text-[11px] text-txt-3">{t.role}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </ScrollReveal>
  );
}
