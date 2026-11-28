"use client";

import { useEffect, useRef, useState } from "react";
import type { AdItem, Placement } from "../../lib/banner";

/**
 * Зарын талбай — artifact-ийн `adBlock()`.
 *
 * Гурван дүрэм зориуд хатуу:
 *  1. «ЗАР» шошго ҮРГЭЛЖ гарна. Artifact-ийн редакцын бодлогод «сурталчилгаа
 *     болон редакцын агуулгыг тусгаарлаж, зарыг «ЗАР» шошготой гаргана» гэж
 *     бичсэн — энэ нь дизайны чимэг биш, амлалт.
 *  2. Зар байхгүй үед ГЭРИЙН ЗАР гарна. Хоосон нүх нь эвдэрсэн сайт шиг
 *     харагдахаас гадна, зар зарах боломжоо өөрөө сурталчилж байгаа нь дээр.
 *  3. Видео нь ДУУГҮЙ, автоматаар. Дуутай эхэлдэг зар бол уншигчийг хөөх
 *     хамгийн хурдан арга.
 */

const EVERY = 6000;

export function AdSlot({
  place,
  items,
  salesEmail,
}: {
  place: Placement;
  items: AdItem[];
  salesEmail: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const many = items.length > 1;

  /** Гүйлгэсэн байрлалаас идэвхтэйг нь уншина — товч ч, чирэлт ч нэг адил. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const read = () =>
      setAt(Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))));
    el.addEventListener("scroll", read, { passive: true });
    return () => el.removeEventListener("scroll", read);
  }, [items.length]);

  useEffect(() => {
    if (!many) return;
    /** Хөдөлгөөн хаасан хүнд зар өөрөө урсахгүй — цэгээр нь өөрөө солино. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      const el = rail.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / Math.max(1, el.clientWidth)) + 1) % items.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, EVERY);
    return () => clearInterval(id);
  }, [many, items.length]);

  const go = (i: number) => {
    const el = rail.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const house = (
    <a className="hous" href={salesEmail ? `mailto:${salesEmail}` : "/ads"}>
      <img src="/artifact/logo-white.png" alt="" />
      <div>
        <b>Таны зар энд байрлана</b>
        <span>Улс төр, бодлогын уншигчдад шууд хүрнэ</span>
      </div>
      <em>Зар байршуулах →</em>
    </a>
  );

  return (
    <div className={place === "side" ? "adw side" : "adw"}>
      <small>ЗАР</small>

      <div className="adr2" ref={rail}>
        {items.length === 0
          ? house
          : items.map((b) => {
              const media =
                b.kind === "video" ? (
                  <video src={b.url} muted autoPlay loop playsInline />
                ) : (
                  <img src={b.url} alt={b.title ?? "Сурталчилгаа"} loading="lazy" />
                );
              return b.link ? (
                <a key={b.id} href={b.link} target="_blank" rel="noopener sponsored">
                  {media}
                </a>
              ) : (
                <span key={b.id}>{media}</span>
              );
            })}
      </div>

      {many ? (
        <div className="add">
          {items.map((b, i) => (
            <button
              key={b.id}
              type="button"
              className={i === at ? "on" : undefined}
              onClick={() => go(i)}
              aria-label={`${i + 1}-р зар`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
