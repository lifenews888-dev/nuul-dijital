export const revalidate = 300;

import { ScrollReveal } from "@/components/scroll-reveal";
import { Marquee } from "@/components/marquee";
import { FAQ } from "@/components/landing/FAQ";
import { LiquidGlassHero } from "@/components/landing/LiquidGlassHero";
import { ServicesSection } from "@/components/landing/sections/ServicesSection";
import { PricingSection } from "@/components/landing/sections/PricingSection";
import { TestimonialsSection } from "@/components/landing/sections/TestimonialsSection";
import { WhyNuulSection } from "@/components/landing/sections/WhyNuulSection";
import { StepsSection } from "@/components/landing/sections/StepsSection";
import { CTASection } from "@/components/landing/sections/CTASection";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { prisma } from "@/lib/prisma";

async function getHeroSettings() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: {
        key: { in: ["hero_video_url", "hero_headline", "hero_subheadline", "hero_tag"] },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      videoUrl: map.hero_video_url || undefined,
      headline: map.hero_headline || undefined,
      subheadline: map.hero_subheadline || undefined,
      tag: map.hero_tag || undefined,
    };
  } catch {
    return { videoUrl: undefined, headline: undefined, subheadline: undefined, tag: undefined };
  }
}

export default async function HomePage() {
  const hero = await getHeroSettings();

  return (
    <>
      <LiquidGlassHero
        videoUrl={hero.videoUrl}
        headline={hero.headline}
        subheadline={hero.subheadline}
        tag={hero.tag}
      />

      {/* Mesh BG behind rest of page */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[150px] -top-[200px] h-[700px] w-[700px] animate-drift1 rounded-full bg-[radial-gradient(circle,#7B6FFF22_0%,transparent_65%)]" />
        <div className="absolute -bottom-[150px] -right-[100px] h-[600px] w-[600px] animate-drift2 rounded-full bg-[radial-gradient(circle,#00E5B815_0%,transparent_65%)]" />
      </div>
      <div className="grid-bg" />

      <Marquee />
      <ServicesSection />

      <ScrollReveal>
        <section
          id="domain"
          className="relative z-[2] mx-auto max-w-[900px] px-6 py-24 sm:px-12"
        >
          <div className="rounded-3xl border border-[--bdv] bg-bg-2/40 p-10 text-center backdrop-blur-sm sm:p-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFB02E]/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFB02E]">
              Тун удахгүй
            </div>
            <h2 className="mb-3 font-syne text-[clamp(28px,3.5vw,42px)] font-bold tracking-tight">
              Домэйн бүртгэлийн үйлчилгээ
              <br />
              <span className="bg-gradient-to-r from-v to-t bg-clip-text text-transparent">
                удахгүй нээгдэнэ
              </span>
            </h2>
            <p className="mx-auto mb-6 max-w-[520px] text-[15px] leading-relaxed text-txt-2">
              .mn, .com, .org домэйн бүртгэх үйлчилгээ хөгжүүлэлтийн шатанд явж байна.
              Шинэчлэлд бүртгүүлбэл нээгдэх дор нь танд мэдэгдэнэ.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-[14px] font-semibold text-black transition-colors hover:bg-gray-100"
            >
              Мэдээллээ үлдээх
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </section>
      </ScrollReveal>

      <PricingSection />
      <TestimonialsSection />
      <WhyNuulSection />

      <ScrollReveal>
        <section className="relative z-[2] px-6 py-24 sm:px-12">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-v">
            <span className="inline-block h-px w-6 bg-v" />
            Асуулт & Хариулт
          </div>
          <h2 className="mb-10 font-syne text-[clamp(32px,4vw,48px)] font-bold">
            Түгээмэл асуултууд
          </h2>
          <div className="mx-auto max-w-[760px]">
            <FAQ />
          </div>
        </section>
      </ScrollReveal>

      <StepsSection />
      <CTASection />
      <PublicFooter />
    </>
  );
}
