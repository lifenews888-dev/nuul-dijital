"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  ChevronDown,
  MessageSquare,
  Newspaper,
  PackageSearch,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { navGroups, type NavGroup } from "@/lib/site";
import { services } from "@/data/services";
import { infrastructureProducts } from "@/data/infrastructure-products";
import { cn } from "@/lib/utils";

/** Grace period so the pointer can travel from a trigger into its panel. */
const CLOSE_DELAY = 120;

/** Icons for the plain link groups; panel groups carry their own in their data. */
const LEAF_ICON: Record<string, LucideIcon> = {
  portfolio: Briefcase,
  caseStudies: TrendingUp,
  industries: Building2,
  about: Users,
  blog: Newspaper,
  careers: UserPlus,
  contact: MessageSquare,
};

function PanelCard({
  href,
  icon: Icon,
  title,
  description,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/5"
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {description}
        </span>
      </span>
    </Link>
  );
}

export function MegaMenu() {
  const t = useTranslations("nav");
  const td = useTranslations("nav.desc");
  const tp = useTranslations("infraProducts");
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(null), CLOSE_DELAY);
  };

  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (g: NavGroup) =>
    g.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  const close = () => setOpen(null);

  return (
    <div
      className="hidden items-center gap-1 lg:flex"
      onMouseLeave={scheduleClose}
      onMouseEnter={cancelClose}
    >
      {navGroups.map((g) => {
        const isOpen = open === g.key;
        const active = isActive(g);
        return (
          <div
            key={g.key}
            // Rich panels span the whole bar, so they anchor to the <nav>; the
            // narrow link dropdowns anchor to their own trigger instead.
            className={cn(!g.panel && "relative")}
            onMouseEnter={() => {
              cancelClose();
              setOpen(g.key);
            }}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : g.key)}
              onFocus={() => setOpen(g.key)}
              className={cn(
                "relative flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                active || isOpen
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {t(g.key)}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "absolute top-full pt-3",
                    g.panel ? "inset-x-0" : "left-0 w-[360px]"
                  )}
                >
                  <div className="glass rounded-2xl p-3 shadow-2xl shadow-black/40">
                    {g.panel === "services" && (
                      <>
                        <div className="grid grid-cols-3 gap-1">
                          {services.map((s) => (
                            <PanelCard
                              key={s.slug}
                              href={`/services/${s.slug}`}
                              icon={s.icon}
                              title={s.title}
                              description={s.short}
                              onNavigate={close}
                            />
                          ))}
                        </div>
                        {g.href && (
                          <div className="mt-1 border-t border-white/10 pt-3">
                            <Link
                              href={g.href}
                              onClick={close}
                              className="group flex w-fit items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-white/5"
                            >
                              {t("allServices")}
                              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          </div>
                        )}
                      </>
                    )}

                    {g.panel === "products" && (
                      <>
                        <div className="grid grid-cols-4 gap-1">
                          {infrastructureProducts.map((p) => (
                            <PanelCard
                              key={p.id}
                              href={p.href}
                              icon={p.icon}
                              title={tp(`${p.id}.title`)}
                              description={tp(`${p.id}.short`)}
                              onNavigate={close}
                            />
                          ))}
                        </div>
                        <div className="mt-1 border-t border-white/10 pt-3">
                          <Link
                            href="/orders/lookup"
                            onClick={close}
                            className="group flex w-fit items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-white/5"
                          >
                            <PackageSearch className="size-4" />
                            {t("orderLookup")}
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      </>
                    )}

                    {g.links && (
                      <div className="grid gap-1">
                        {g.links.map((l) => (
                          <PanelCard
                            key={l.href}
                            href={l.href}
                            icon={LEAF_ICON[l.key] ?? Briefcase}
                            title={t(l.key)}
                            description={td(l.key)}
                            onNavigate={close}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
