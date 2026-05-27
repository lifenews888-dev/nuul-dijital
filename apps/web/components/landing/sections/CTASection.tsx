import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";

export function CTASection() {
  return (
    <ScrollReveal>
      <section className="relative z-[2] px-6 py-24 sm:px-12">
        <div className="relative mx-auto max-w-[760px] overflow-hidden rounded-3xl border border-white/[0.06] bg-black px-8 py-16 text-center sm:px-12 sm:py-20">
          {/* Subtle top accent */}
          <div className="absolute left-[25%] right-[25%] top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <h2 className="relative z-10 mb-4 font-syne text-[clamp(32px,4vw,52px)] font-normal leading-[1.05] tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>
            Бизнесээ өсгөх<br />цаг боллоо.
          </h2>
          <p className="relative z-10 mb-9 text-[15px] leading-relaxed text-gray-400">
            Үнийн санал авах нь үнэгүй. Хариу 24 цагт.
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-[14px] font-medium text-black transition-colors hover:bg-gray-100"
            >
              Үнийн санал авах
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/services"
              className="rounded-lg border border-white/20 bg-transparent px-7 py-3 text-[14px] font-medium text-white transition-colors hover:bg-white hover:text-black"
            >
              Үйлчилгээ үзэх
            </Link>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
