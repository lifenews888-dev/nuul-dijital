"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { NavItem } from "../../lib/studio-nav";

/**
 * Хажуугийн зурвас — admin.html-ийн `.side` ба `.nv`.
 *
 * Идэвхтэй холбоосыг `aria-current="page"` гэж тэмдэглэнэ: өнгө нь
 * дэлгэц уншигчид хүрэхгүй, харин энэ атрибут хүрнэ. `app/studio.css`
 * улбар шар зураасыг мөн түүгээр зурна.
 */
export function StudioNav({
  items,
  name,
  role,
}: {
  items: NavItem[];
  name: string;
  role: string;
}) {
  const pathname = usePathname();

  /**
   * `/studio/news/abc` дээр «Мэдээнүүд» идэвхтэй байх ёстой, гэхдээ
   * `/studio/news/new` дээр «Шинэ мэдээ» нь илүү тодорхой таарна. Иймд
   * хамгийн УРТ таарсан замыг сонгоно.
   */
  const active = items.reduce<string | null>((best, item) => {
    const hit = pathname === item.href || pathname.startsWith(item.href + "/");
    if (!hit) return best;
    return best === null || item.href.length > best.length ? item.href : best;
  }, null);

  return (
    <nav
      aria-label="Редакцын цэс"
      className="flex shrink-0 gap-1 bg-rail px-3.5 py-2 md:sticky md:top-0 md:h-screen md:w-[248px] md:flex-col md:py-[22px]"
    >
      <Link
        href="/studio"
        className="mb-0 hidden font-head text-[17px] font-bold text-white md:mb-6 md:block md:px-3"
      >
        Редакц
      </Link>

      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active === item.href ? "page" : undefined}
          className={
            "studio-nav-item relative flex flex-1 items-center justify-center rounded-[10px] px-3 font-head text-[13px] font-semibold md:h-11 md:flex-none md:justify-start md:text-[14.5px] " +
            (active === item.href
              ? "bg-white/[0.14] text-white"
              : "text-[color:var(--rail-dim)] hover:bg-white/[0.06] hover:text-white")
          }
        >
          {item.label}
        </Link>
      ))}

      <div className="hidden md:block md:flex-1" />

      <div className="hidden border-t border-white/10 px-3 pt-3 font-head text-[13px] text-[color:var(--rail-dim)] md:block">
        <b className="block font-semibold text-white">{name}</b>
        {role}
      </div>

      {/* Утсан дээр ч хүрэхүйц байх ёстой — гарах арга нь нуугдаж болохгүй */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/studio/signin" })}
        className="flex flex-1 items-center justify-center rounded-[10px] px-3 font-head text-[13px] font-semibold text-[color:var(--rail-dim)] hover:bg-white/[0.06] hover:text-white md:h-10 md:flex-none md:justify-start"
      >
        Гарах
      </button>
    </nav>
  );
}
