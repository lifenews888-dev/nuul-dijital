import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import { prisma } from "@/lib/prisma";

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  priceSmall: boolean;
  description: string;
  features: string[];
  featured: boolean;
  btnText: string;
  btnLink: string;
};

const FALLBACK_PLANS: PricingPlan[] = [
  {
    id: "fallback-starter",
    name: "Starter",
    price: "₮490,000",
    priceSmall: false,
    description: "Шинээр эхэлж буй бизнест",
    features: [
      "Сарын 8 FB контент",
      "Facebook page удирдлага",
      "1 рекламын кампанит ажил",
      "Сар бүр тайлан",
      "Имэйл дэмжлэг",
    ],
    featured: false,
    btnText: "Санал авах",
    btnLink: "/contact",
  },
  {
    id: "fallback-growth",
    name: "Growth",
    price: "₮1,200,000",
    priceSmall: false,
    description: "Өсөлтөд бэлтгэж буй бизнест",
    features: [
      "Сарын 16 FB + IG контент",
      "Google + Meta Ads удирдлага",
      "AI чатбот суулгах & тохируулах",
      "Сар бүр дэлгэрэнгүй тайлан",
      "Чат + утсаар дэмжлэг",
    ],
    featured: true,
    btnText: "Санал авах",
    btnLink: "/contact",
  },
  {
    id: "fallback-enterprise",
    name: "Enterprise",
    price: "Тохиролцоно",
    priceSmall: true,
    description: "Том брэнд, байгууллагад",
    features: [
      "Бүтэн маркетинг багаар",
      "Вэбсайт + Landing page хийх",
      "Call center + CRM суурилуулах",
      "Стратеги & brand identity",
      "Dedicated account manager",
    ],
    featured: false,
    btnText: "Холбоо барих",
    btnLink: "/contact",
  },
];

async function getPlans(): Promise<PricingPlan[]> {
  try {
    const dbPlans = await prisma.marketingPlan.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return dbPlans.length > 0 ? dbPlans : FALLBACK_PLANS;
  } catch {
    return FALLBACK_PLANS;
  }
}

export async function PricingSection() {
  const plans = await getPlans();

  return (
    <ScrollReveal>
      <section id="price" className="relative z-[2] px-6 py-24 sm:px-12">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
          <span className="inline-block h-px w-6 bg-gray-500" />
          Үнэ
        </div>
        <h2 className="mb-3 font-syne text-[clamp(32px,4vw,48px)] font-normal leading-tight tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>
          Шударга үнэ.<br />Нуугдмал зардал үгүй.
        </h2>
        <p className="mb-14 max-w-[500px] text-[15px] leading-relaxed text-gray-400">
          Хэдийд ч цуцалж болно. Урт хугацааны гэрээ шаардлагагүй.
        </p>

        <div className="grid items-start gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-2xl border p-8 transition-all hover:-translate-y-1 ${
                plan.featured
                  ? "border-[--bdv] bg-gradient-to-br from-bg-3 to-bg-4 shadow-[0_0_40px_#7B6FFF18] hover:-translate-y-1.5 hover:shadow-[0_12px_50px_#7B6FFF25]"
                  : "border-[--bd] bg-bg-2"
              }`}
            >
              {plan.featured && (
                <>
                  <div className="absolute left-[10%] right-[10%] top-0 h-0.5 bg-gradient-to-r from-transparent via-v to-transparent" />
                  <div className="mb-4 inline-block rounded-[5px] border border-[#7B6FFF25] bg-[#7B6FFF18] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-v-soft">
                    Хамгийн их сонгогддог
                  </div>
                </>
              )}
              <div className="mb-2 font-clash text-xl font-semibold tracking-tight">
                {plan.name}
              </div>
              <div
                className={`text-gradient-txt-vg mb-1 font-clash font-bold tracking-tight ${
                  plan.priceSmall
                    ? "mt-1.5 text-[22px]"
                    : "text-[38px] tracking-[-2px]"
                }`}
              >
                {plan.price}
                {!plan.priceSmall && (
                  <span className="font-cabinet text-sm font-normal text-txt-2">
                    /сар
                  </span>
                )}
              </div>
              <div className="mb-6 text-xs text-txt-3">{plan.description}</div>
              <div className="mb-5 h-px bg-gradient-to-r from-transparent via-[--bdv] to-transparent" />
              <div className="mb-6 flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-xs text-txt-2"
                  >
                    <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] border border-[#00E5B830] bg-[#00E5B815]">
                      <svg width="9" height="9" viewBox="0 0 8 8">
                        <polyline
                          points="1,4 3,6 7,2"
                          fill="none"
                          stroke="#00E5B8"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href={plan.btnLink}
                className={`block w-full rounded-[10px] py-3 text-center font-cabinet text-[13px] font-bold transition-all ${
                  plan.featured
                    ? "bg-gradient-to-br from-v to-v-dark text-white shadow-[0_0_20px_#7B6FFF30] hover:-translate-y-0.5 hover:shadow-[0_0_30px_#7B6FFF50]"
                    : "border border-[--bdv] bg-transparent text-v-soft hover:border-v hover:bg-[#7B6FFF0D]"
                }`}
              >
                {plan.btnText}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
