"use client";

import { useState, useEffect } from "react";
import { usePathname as useRawPathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { navGroups, type NavGroup } from "@/lib/site";
import { services } from "@/data/services";
import { infrastructureProducts } from "@/data/infrastructure-products";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { MegaMenu } from "@/components/layout/mega-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { cn } from "@/lib/utils";

// Mongolian-only for now: the English UI is complete but marketing content is
// not yet translated, so the language switcher is hidden. The i18n foundation
// (routing, /en, translations) stays intact — flip this to true to re-enable.
const SHOW_LANGUAGE_SWITCHER = false;

export function Navbar({ logoUrl }: { logoUrl?: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const rawPathname = useRawPathname();
  const t = useTranslations("nav");
  const tp = useTranslations("infraProducts");
  const tc = useTranslations("cta");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  // The /admin area renders its own chrome.
  if (rawPathname?.startsWith("/admin")) return null;

  /** Flattens a group into the plain links the mobile sheet lists. */
  const mobileItems = (g: NavGroup): { href: string; label: string }[] => {
    if (g.panel === "services") {
      return [
        ...services.map((s) => ({ href: `/services/${s.slug}`, label: s.title })),
        { href: "/services", label: t("allServices") },
      ];
    }
    if (g.panel === "products") {
      return [
        ...infrastructureProducts.map((p) => ({
          href: p.href,
          label: tp(`${p.id}.title`),
        })),
        { href: "/orders/lookup", label: t("orderLookup") },
      ];
    }
    return (g.links ?? []).map((l) => ({ href: l.href, label: t(l.key) }));
  };

  const groupActive = (g: NavGroup) =>
    g.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          // `relative` anchors the mega-menu panels to the full bar width.
          "relative flex w-full max-w-[1280px] items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 sm:px-6",
          scrolled
            ? "glass shadow-2xl shadow-black/40"
            : "border border-transparent bg-transparent"
        )}
      >
        <Link href="/" aria-label="Nuul Digital" className="group">
          <Logo size={logoUrl ? 52 : 36} live={!logoUrl} src={logoUrl} />
        </Link>

        <MegaMenu />

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
            aria-expanded={open}
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
            className="absolute inset-x-4 top-20 z-40 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl glass p-4 shadow-2xl lg:hidden"
          >
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                  pathname === "/"
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {t("home")}
              </Link>

              {navGroups.map((g) => {
                const expanded = openGroup === g.key;
                return (
                  <div key={g.key}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpenGroup(expanded ? null : g.key)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors",
                        groupActive(g)
                          ? "bg-white/10 text-foreground"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      {t(g.key)}
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform duration-200",
                          expanded && "rotate-180"
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 py-1 pl-3">
                            {mobileItems(g).map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                  "rounded-lg px-3 py-2 text-sm transition-colors",
                                  pathname === item.href
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

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
