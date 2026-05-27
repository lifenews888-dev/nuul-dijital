"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  openInNew: boolean;
}

const fallbackItems: NavItem[] = [
  { id: "1", label: "Үйлчилгээ", href: "/services", openInNew: false },
  { id: "2", label: "Домэйн", href: "/#domain", openInNew: false },
  { id: "3", label: "Үнэ", href: "/#price", openInNew: false },
  { id: "4", label: "Блог", href: "/blog", openInNew: false },
  { id: "5", label: "Бидний тухай", href: "/about", openInNew: false },
  { id: "6", label: "Холбоо барих", href: "/contact", openInNew: false },
];

export function PublicNav() {
  const pathname = usePathname();
  const [items, setItems] = useState<NavItem[]>(fallbackItems);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/nav")
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) setItems(data.items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isAnchor = (href: string) => href.startsWith("#") || href.startsWith("/#");

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[500] flex h-[66px] items-center justify-between px-6 transition-all sm:px-12 ${
        scrolled ? "border-b border-[--bdv] bg-[#03030A]/80 backdrop-blur-xl" : ""
      }`}
    >
      {!scrolled && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#03030ACC] to-transparent" />
          <div className="absolute bottom-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[--bdv] to-transparent" />
        </>
      )}

      {/* Logo */}
      <Link href="/" className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-v to-v-dark shadow-[0_0_20px_#7B6FFF40,inset_0_1px_0_#FFFFFF20]">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16 14H2Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 7L12.5 13H5.5Z" fill="#fff" opacity=".45" />
            <circle cx="9" cy="9" r="1.6" fill="#fff" />
          </svg>
        </div>
        <span className="font-clash text-lg font-semibold tracking-tight">
          nuul<span className="text-v-soft">.digital</span>
        </span>
      </Link>

      {/* Desktop nav links */}
      <div className="relative z-10 hidden gap-0 md:flex">
        {items.map((item) => {
          const active = isActive(item.href);
          const anchor = isAnchor(item.href);
          const cls = `rounded-lg px-4 py-2 text-[13px] transition-all hover:bg-white/[0.03] hover:text-txt ${
            active ? "text-txt" : "text-txt-2"
          }`;

          if (anchor) {
            return (
              <a
                key={item.id}
                href={item.href}
                className={cls}
                {...(item.openInNew ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cls}
              {...(item.openInNew ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Desktop buttons */}
      <div className="relative z-10 hidden items-center gap-2 md:flex">
        <Link
          href="/auth/signin"
          className="rounded-[9px] border border-[--bd] bg-transparent px-5 py-2 font-cabinet text-[13px] font-medium text-txt-2 transition-all hover:border-[--bdv] hover:text-txt"
        >
          Нэвтрэх
        </Link>
        <Link
          href="/dashboard"
          className="relative overflow-hidden rounded-[9px] bg-gradient-to-br from-v to-v-dark px-5 py-2 font-cabinet text-[13px] font-bold text-white shadow-[0_0_20px_#7B6FFF35] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_#7B6FFF55]"
        >
          Эхлэх &rarr;
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen((o) => !o)}
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg text-txt-2 transition-colors hover:bg-white/[0.06] hover:text-txt md:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[66px] z-[499] flex flex-col bg-[#03030A]/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-6">
            {items.map((item) => {
              const active = isActive(item.href);
              const anchor = isAnchor(item.href);

              const cls = `rounded-xl px-4 py-3.5 text-[15px] font-medium transition-all ${
                active
                  ? "bg-v/10 text-v-soft"
                  : "text-txt-2 hover:bg-white/[0.04] hover:text-txt"
              }`;

              if (anchor) {
                return (
                  <a key={item.id} href={item.href} className={cls}>
                    {item.label}
                  </a>
                );
              }

              return (
                <Link key={item.id} href={item.href} className={cls}>
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/auth/signin"
                className="rounded-xl border border-[--bd] py-3 text-center font-cabinet text-[14px] font-medium text-txt-2 transition-all hover:border-[--bdv] hover:text-txt"
              >
                Нэвтрэх
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl bg-gradient-to-br from-v to-v-dark py-3 text-center font-cabinet text-[14px] font-bold text-white shadow-[0_0_20px_#7B6FFF35]"
              >
                Эхлэх &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
