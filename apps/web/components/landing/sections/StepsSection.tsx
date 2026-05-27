import { ScrollReveal } from "@/components/scroll-reveal";

const steps = [
  { step: "01", title: "Холбоо барих", desc: "Үйлчилгээний санал хэрэгцээгээ танилцуулж 2 минутад хүсэлт илгээнэ." },
  { step: "02", title: "Үнийн санал авах", desc: "Таны төсөв, хүсэлтэд тохирсон төлөвлөгөөг 24 цагт боловсруулна." },
  { step: "03", title: "Гэрээ байгуулах", desc: "Тохирсон үнэ, хугацааны үндсэн дээр гэрээ хийж ажил эхлүүлнэ." },
  { step: "04", title: "Үр дүн харах", desc: "Сар бүр гүйцэтгэлийн тайлан, маркетингийн өсөлтийн дугаар хүлээн авна." },
];

export function StepsSection() {
  return (
    <ScrollReveal>
      <section className="relative z-[2] px-6 py-24 sm:px-12">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
          <span className="inline-block h-px w-6 bg-gray-500" />
          Хэрхэн ажилладаг вэ
        </div>
        <h2 className="mb-14 font-syne text-[clamp(32px,4vw,48px)] font-normal leading-tight tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>
          4 алхамтай хамтын ажиллагаа
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, i) => (
            <div key={item.step} className="group relative flex flex-col items-start text-left">
              {i < steps.length - 1 && (
                <div className="pointer-events-none absolute -right-3 top-8 z-10 hidden text-white/20 lg:block">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] font-mono text-base font-semibold text-white/60 transition-colors group-hover:border-white/20 group-hover:text-white">
                {item.step}
              </div>
              <h3 className="mb-2 font-syne text-lg font-semibold tracking-tight text-white">
                {item.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
