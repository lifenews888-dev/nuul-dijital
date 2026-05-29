export const revalidate = 300;

import { ScrollReveal } from "@/components/scroll-reveal";
import { Marquee } from "@/components/marquee";
import { FAQ } from "@/components/landing/FAQ";
import { LiquidGlassHero } from "@/components/landing/LiquidGlassHero";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { ServicesSection } from "@/components/landing/sections/ServicesSection";
import { PricingSection } from "@/components/landing/sections/PricingSection";
import { TestimonialsSection } from "@/components/landing/sections/TestimonialsSection";
import { WhyNuulSection } from "@/components/landing/sections/WhyNuulSection";
import { StepsSection } from "@/components/landing/sections/StepsSection";
import { CTASection } from "@/components/landing/sections/CTASection";
import { PortfolioSection } from "@/components/landing/sections/PortfolioSection";
import { TechStandardSection } from "@/components/landing/sections/TechStandardSection";
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

async function getHeroMedia() {
  try {
    return await prisma.heroMedia.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, type: true, url: true },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [hero, heroMedia] = await Promise.all([getHeroSettings(), getHeroMedia()]);

  return (
    <>
      <FloatingNav />
      <LiquidGlassHero
        videoUrl={hero.videoUrl}
        media={heroMedia}
        headline={hero.headline}
        subheadline={hero.subheadline}
        tag={hero.tag}
      />

      {/* Subtle ambient glow behind rest of page (keeps hero/rest cohesive) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[300px] top-[40%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,#6C63FF12_0%,transparent_70%)]" />
        <div className="absolute -right-[200px] bottom-[20%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,#00D4AA08_0%,transparent_70%)]" />
      </div>

      <Marquee />
      <ServicesSection />

      <ScrollReveal>
        <section
          id="domain"
          className="relative z-[2] mx-auto max-w-[900px] px-6 py-24 sm:px-12"
        >
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center backdrop-blur-sm sm:p-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-300">
              Тун удахгүй
            </div>
            <h2 className="mb-3 font-syne text-[clamp(28px,3.5vw,42px)] font-normal leading-tight tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>
              Домэйн бүртгэлийн үйлчилгээ<br />удахгүй нээгдэнэ
            </h2>
            <p className="mx-auto mb-7 max-w-[520px] text-[15px] leading-relaxed text-gray-400">
              .mn, .com, .org домэйн бүртгэх үйлчилгээ хөгжүүлэлтийн шатанд явж байна.
              Нээгдэх үед танд хамгийн түрүүнд мэдэгдэх үү?
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-[14px] font-medium text-black transition-colors hover:bg-gray-100"
            >
              Мэдээллээ үлдээх
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </section>
      </ScrollReveal>

      <PortfolioSection />
      <TechStandardSection />
      <PricingSection />
      <TestimonialsSection />
      <WhyNuulSection />

      <ScrollReveal>
        <section className="relative z-[2] px-6 py-24 sm:px-12">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
            <span className="inline-block h-px w-6 bg-gray-500" />
            Асуулт & Хариулт
          </div>
          <h2 className="mb-10 font-syne text-[clamp(32px,4vw,48px)] font-normal leading-tight tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>
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
