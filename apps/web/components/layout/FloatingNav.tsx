"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

const NAV_LINKS = [
  { label: "Үйлчилгээ", href: "/services" },
  { label: "Блог", href: "/blog" },
  { label: "Бидний тухай", href: "/about" },
  { label: "Холбоо барих", href: "/contact" },
];

/**
 * Fixed top nav that slides down once the user scrolls past the hero.
 * Used on the homepage where the hero owns the in-view navigation —
 * after scroll, this floating bar takes over so users always have menu access.
 */
export function FloatingNav({ showAfter = 600 }: { showAfter?: number }) {
  const [visible, setVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter]);

  // Close mobile drawer on navigation / when hidden
  useEffect(() => {
    if (!visible) setMobileOpen(false);
  }, [visible]);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 px-4 pt-3 transition-all duration-300 sm:px-6 sm:pt-4 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-4 opacity-0"
      }`}
    >
      <nav className="liquid-glass mx-auto flex max-w-6xl items-center justify-between rounded-xl px-4 py-2.5 text-white">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <BrandLogo suffixClassName="text-white/60" />
        </Link>
        <div className="hidden items-center gap-7 text-[14px] md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-gray-300">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="hidden rounded-lg bg-white px-5 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-gray-100 sm:inline-block"
          >
            Үнийн санал авах
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/30 text-white transition-colors hover:bg-white hover:text-black md:hidden"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="liquid-glass mx-auto mt-2 max-w-6xl overflow-hidden rounded-xl border border-white/10 md:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-5 py-3 text-[15px] text-white/90 transition-colors hover:bg-white/10"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="m-3 rounded-lg bg-white px-5 py-3 text-center text-[14px] font-semibold text-black transition-colors hover:bg-gray-100 sm:hidden"
            >
              Үнийн санал авах
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
