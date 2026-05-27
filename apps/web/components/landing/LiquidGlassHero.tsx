"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

const NAV_LINKS = [
  { label: "Үйлчилгээ", href: "/services" },
  { label: "Блог", href: "/blog" },
  { label: "Бидний тухай", href: "/about" },
  { label: "Холбоо барих", href: "/contact" },
];

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

interface Props {
  videoUrl?: string;
  headline?: string;
  subheadline?: string;
  tag?: string;
}

const DEFAULT_HEADLINE = "Бизнесээ дижитал\nертөнцөд өсгөнө.";
const DEFAULT_SUBHEADLINE =
  "Вэбсайт, чатбот, маркетинг, FB контент — бид хийж өгнө. Та бизнесээ өсгөнө.";
const DEFAULT_TAG = "Маркетинг. Вэбсайт. Чатбот.";

function FadeIn({
  children,
  delay = 0,
  duration = 1000,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedHeading({
  text,
  className = "",
  initialDelay = 200,
  charDelay = 30,
  charDuration = 500,
  style,
}: {
  text: string;
  className?: string;
  initialDelay?: number;
  charDelay?: number;
  charDuration?: number;
  style?: React.CSSProperties;
}) {
  const [start, setStart] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStart(true), initialDelay);
    return () => clearTimeout(t);
  }, [initialDelay]);

  const lines = text.split("\n");

  return (
    <h1 className={className} style={style} aria-label={text.replace(/\s*\n\s*/g, " ")}>
      {lines.map((line, lineIdx) => {
        let charOffset = 0;
        return (
          <span key={lineIdx} className="block" aria-hidden="true">
            {line.split(" ").map((word, wordIdx, words) => {
              const wordOffset = charOffset;
              charOffset += word.length + (wordIdx < words.length - 1 ? 1 : 0);

              return (
                <span key={`${lineIdx}-${wordIdx}`} className="inline-block whitespace-nowrap">
                  {Array.from(word).map((ch, charIdx) => {
                    const totalDelay =
                      lineIdx * line.length * charDelay +
                      (wordOffset + charIdx) * charDelay;
                    return (
                      <span
                        key={charIdx}
                        className="inline-block"
                        style={{
                          opacity: start ? 1 : 0,
                          transform: start ? "translateX(0)" : "translateX(-18px)",
                          transition: `opacity ${charDuration}ms ease-out, transform ${charDuration}ms ease-out`,
                          transitionDelay: `${totalDelay}ms`,
                        }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                  {wordIdx < words.length - 1 && " "}
                </span>
              );
            })}
          </span>
        );
      })}
    </h1>
  );
}

export function LiquidGlassHero({
  videoUrl,
  headline = DEFAULT_HEADLINE,
  subheadline = DEFAULT_SUBHEADLINE,
  tag = DEFAULT_TAG,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section
      className={`relative min-h-screen w-full overflow-hidden bg-black text-white ${inter.className}`}
    >
      {/* Background video or fallback gradient */}
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0518] to-black" />
          <div className="absolute -left-[200px] top-[20%] h-[600px] w-[600px] animate-drift1 rounded-full bg-[radial-gradient(circle,#6C63FF35_0%,transparent_60%)]" />
          <div className="absolute -right-[150px] bottom-[10%] h-[500px] w-[500px] animate-drift2 rounded-full bg-[radial-gradient(circle,#00D4AA20_0%,transparent_60%)]" />
        </div>
      )}

      {/* Foreground content */}
      <div className="relative z-10 flex min-h-screen flex-col px-6 pt-6 md:px-12 lg:px-16">
        {/* Navbar */}
        <FadeIn delay={100} duration={800} className="relative">
          <nav className="liquid-glass flex items-center justify-between rounded-xl px-4 py-2">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              <BrandLogo suffixClassName="text-white/60" />
            </Link>
            <div className="hidden items-center gap-8 text-sm md:flex">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="transition-colors hover:text-gray-300">
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/contact"
                className="hidden rounded-lg bg-white px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-100 sm:inline-block"
              >
                Үнийн санал авах
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/30 text-white transition-colors hover:bg-white hover:text-black md:hidden"
              >
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </nav>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="liquid-glass absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 md:hidden">
              <div className="flex flex-col">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-5 py-3 text-[15px] text-white/90 transition-colors hover:bg-white/10"
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="m-3 rounded-lg bg-white px-5 py-3 text-center text-[14px] font-semibold text-black transition-colors hover:bg-gray-100 sm:hidden"
                >
                  Үнийн санал авах
                </Link>
              </div>
            </div>
          )}
        </FadeIn>

        {/* Hero content (anchored to bottom) */}
        <div className="flex flex-1 flex-col justify-end pb-12 lg:pb-16">
          <div className="lg:grid lg:grid-cols-2 lg:items-end lg:gap-8">
            {/* Left: heading + buttons */}
            <div>
              <AnimatedHeading
                text={headline}
                className="mb-4 max-w-[760px] text-4xl font-normal leading-[0.98] md:text-5xl lg:text-6xl xl:text-7xl"
                initialDelay={200}
                charDelay={30}
                charDuration={500}
              />

              <FadeIn delay={800} duration={1000}>
                <p className="mb-5 max-w-xl text-base text-gray-300 md:text-lg">
                  {subheadline}
                </p>
              </FadeIn>

              <FadeIn delay={1200} duration={1000}>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/contact"
                    className="rounded-lg bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-gray-100"
                  >
                    Үнийн санал авах
                  </Link>
                  <Link
                    href="/services"
                    className="liquid-glass rounded-lg border border-white/20 px-8 py-3 font-medium text-white transition-colors hover:bg-white hover:text-black"
                  >
                    Үйлчилгээ үзэх
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Right: glass tag */}
            <FadeIn
              delay={1400}
              duration={1000}
              className="mt-8 flex items-end justify-start lg:mt-0 lg:justify-end"
            >
              <div className="liquid-glass rounded-xl border border-white/20 px-6 py-3">
                <span className="text-lg font-light md:text-xl lg:text-2xl">
                  {tag}
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
