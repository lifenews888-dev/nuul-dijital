import { ScrollReveal } from "@/components/scroll-reveal";

const features = [
  {
    title: "Бүх зүйл нэг газар",
    desc: "Вэбсайт, чатбот, дижитал маркетинг, FB контент — бизнесээ өсгөх бүх хэрэгсэл нэг платформоос",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Минутын дотор нээгдэнэ",
    desc: "Бүртгэлээс эхлээд домэйн, хостинг идэвхжүүлэх хүртэл автомат. Хүлээх, залгах шаардлагагүй",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Монгол хэлээр 24/7",
    desc: "AI туслах болон жинхэнэ хүмүүс Монгол хэлээр 24 цаг дэмжиж, асуулт бүрт хариулна",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    title: "Ил тод үнэ",
    desc: "Нуугдмал төлбөргүй. Юунд төлж буйгаа таньж, хэдийд ч үнийн багцаа өөрчилнө",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export function WhyNuulSection() {
  return (
    <ScrollReveal>
      <section className="relative z-[2] px-6 py-24 sm:px-12">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-v">
          <span className="inline-block h-px w-6 bg-v" />
          Бидний онцлог
        </div>
        <h2 className="mb-3 font-syne text-[clamp(32px,4vw,48px)] font-bold leading-tight tracking-tight">
          Яагаад Nuul.digital?
        </h2>
        <p className="mb-14 max-w-[560px] text-[15px] leading-relaxed text-txt-2">
          Бизнесээ дижитал ертөнцөд нээх хамгийн хялбар зам
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/[0.04] bg-bg-2/60 p-6 transition-all hover:border-v/30 hover:bg-bg-2"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-v/10 text-v transition-colors group-hover:bg-v/15">
                {f.icon}
              </div>
              <h3 className="mb-2 font-syne text-[17px] font-bold tracking-tight text-txt">
                {f.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-txt-2">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
