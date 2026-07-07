"use client";

import { useState, useEffect } from "react";
import { usePathname as useRawPathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { navLinks } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { cn } from "@/lib/utils";

// Mongolian-only for now: the English UI is complete but marketing content is
// not yet translated, so the language switcher is hidden. The i18n foundation
// (routing, /en, translations) stays intact — flip this to true to re-enable.
const SHOW_LANGUAGE_SWITCHER = false;

/** Maps a nav href to its translation key in messages `nav`. */
const NAV_KEY: Record<string, string> = {
  "/": "home",
  "/about": "about",
  "/services": "services",
  "/domains": "domains",
  "/hosting": "hosting",
  "/business-email": "businessEmail",
  "/industries": "industries",
  "/portfolio": "portfolio",
  "/case-studies": "caseStudies",
  "/blog": "blog",
  "/careers": "careers",
  "/contact": "contact",
};

export function Navbar({ logoUrl }: { logoUrl?: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rawPathname = useRawPathname();
  const t = useTranslations("nav");
  const tc = useTranslations("cta");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // The /admin area renders its own chrome.
  if (rawPathname?.startsWith("/admin")) return null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "flex w-full max-w-[1280px] items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 sm:px-6",
          scrolled
            ? "glass shadow-2xl shadow-black/40"
            : "border border-transparent bg-transparent"
        )}
      >
        <Link href="/" aria-label="Nuul Digital" className="group">
          <Logo size={logoUrl ? 52 : 36} live={!logoUrl} src={logoUrl} />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {t(NAV_KEY[link.href])}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {SHOW_LANGUAGE_SWITCHER && (
            <LanguageSwitcher className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex" />
          )}
          <Button asChild variant="gradient" size="sm" className="hidden sm:inline-flex">
            <Link href="/quote">
              {tc("quote")} <ArrowUpRight className="size-4" />
            </Link>
          </Button>
          <button
            aria-label={tc("menu")}
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-4 top-20 z-40 rounded-2xl glass p-4 shadow-2xl lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                    pathname === link.href
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {t(NAV_KEY[link.href])}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2">
                {SHOW_LANGUAGE_SWITCHER && <LanguageSwitcher />}
                <Button asChild variant="gradient" className="flex-1">
                  <Link href="/quote">{tc("getQuote")}</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
