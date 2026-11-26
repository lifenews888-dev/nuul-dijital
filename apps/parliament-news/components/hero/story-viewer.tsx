"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nextStory, STORY_MS } from "../../lib/story-nav";

export type StoryItem = {
  slug: string;
  title: string;
  lead: string;
  category: string;
  /** "2026.11.26" */
  date: string;
  featured: boolean;
  src: string;
};

/** Давхарга дотор фокус барих — эдгээрээр л эргэнэ */
const FOCUSABLE = 'button, [href], [tabindex]:not([tabindex="-1"])';

/** Доош чирэх нь хаана — artifact-ийн 90px */
const SWIPE_CLOSE = 90;

/**
 * Сторины бүтэн дэлгэцийн үзүүлэгч — artifact-ийн `#sv` (index.html:605).
 *
 * Зурвасын холбоосууд нь СЕРВЕРЭЭС ирсэн жинхэнэ `<a href>`: JS ажиллахгүй
 * бол дарахад мэдээ нээгдэнэ. JS байгаа үед энэ компонент `#stories` дээрх
 * дарлтыг барьж аваад давхаргыг нээнэ — artifact-ийн делегацийн загвараар.
 * Шинэ таб (Ctrl/Cmd, дунд товч) нь хөтөчид үлдэнэ.
 */
export function StoryViewer({ stories }: { stories: StoryItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);

  const svpRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const touchY = useRef<number | null>(null);

  const total = stories.length;
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (dir: 1 | -1) => setIndex((cur) => (cur === null ? null : nextStory(cur, total, dir))),
    [total],
  );

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Зурвас дээрх дарлтыг барих
  useEffect(() => {
    const rail = document.getElementById("stories");
    if (!rail) return;
    const onClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-sk]");
      if (!el) return;
      const k = Number(el.dataset.sk);
      if (!Number.isInteger(k) || k < 0 || k >= total) return;
      e.preventDefault();
      openerRef.current = el;
      setIndex(k);
    };
    rail.addEventListener("click", onClick);
    return () => rail.removeEventListener("click", onClick);
  }, [total]);

  /**
   * Нээлттэй үед: ард гүйлт түгжигдэнэ, фокус давхарга дотор орж, хаахад
   * дарсан стори руугаа буцна. Гарнаас гарч чадахгүй давхарга нь урхи.
   *
   * Хамаарал нь НЭЭЛТТЭЙ ЭСЭХ, `index` БИШ. `index`-ээр түлхүүрлэвэл стори
   * солигдох бүрт (6 секунд тутам автоматаар ч) цэвэрлэгээ ажиллаж, фокус
   * давхаргын АРД байгаа зурвасын дугуй руу үсэрч буцаж ирнэ: «Мэдээг
   * унших» дээр очсон хүнийг уншиж байтал хаах товч руу чангаана.
   */
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const opener = openerRef.current;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    document.getElementById("svx")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key !== "Tab") return;
      const box = boxRef.current;
      if (!box) return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onUp = () => {
      pausedRef.current = false;
    };

    addEventListener("keydown", onKey);
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onUp);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onUp);
      body.style.overflow = prevOverflow;
      pausedRef.current = false;
      opener?.focus();
    };
  }, [open, close, step]);

  /**
   * Явцын зураас ба автомат шилжилт.
   *
   * `prefers-reduced-motion` үед автоматаар шилжихгүй: өөрөө хөдөлдөг
   * агуулгыг зогсоох боломжгүй бол хүн уншиж амжихгүй. Тэр үед зураас нь
   * дүүрсэн хэвээр, шилжилт нь зөвхөн гар/дарлтаар.
   */
  useEffect(() => {
    if (index === null) return;
    const bars = Array.from(
      svpRef.current?.querySelectorAll<HTMLElement>("b > i") ?? [],
    );
    bars.forEach((el, j) => {
      el.style.width = j < index || (j === index && reduced) ? "100%" : "0%";
    });
    if (reduced) return;

    const current = bars[index];
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    const tick = (now: number) => {
      const dt = last ? now - last : 0;
      last = now;
      if (!pausedRef.current) elapsed += dt;
      const p = Math.min(1, elapsed / STORY_MS);
      if (current) current.style.width = `${p * 100}%`;
      if (p >= 1) {
        setIndex((cur) => (cur === null ? null : nextStory(cur, total, 1)));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, reduced, total]);

  if (total === 0) return null;
  const active = index === null ? null : stories[index];

  return (
    <div
      className="sv"
      id="sv"
      hidden={active === null}
      role="dialog"
      aria-modal="true"
      aria-label="Стори"
    >
      {active ? (
        <div
          className="svb"
          id="svb"
          ref={boxRef}
          onPointerDown={(e) => {
            if (!(e.target as HTMLElement).closest("button, a")) pausedRef.current = true;
          }}
          onTouchStart={(e) => {
            touchY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const y0 = touchY.current;
            touchY.current = null;
            if (y0 !== null && e.changedTouches[0].clientY - y0 > SWIPE_CLOSE) close();
          }}
        >
          <div className="svp" id="svp" ref={svpRef} aria-hidden="true">
            {stories.map((s) => (
              <b key={s.slug}>
                <i />
              </b>
            ))}
          </div>

          <div className="svh">
            <img src="/artifact/logo-white.png" alt="Parliament News" height={20} />
            <span id="svd">{active.date}</span>
            <button id="svx" type="button" aria-label="Хаах" onClick={close}>
              ✕
            </button>
          </div>

          <div className="svm" id="svm">
            <img src={active.src} alt="" />
          </div>

          <div className="svt">
            <span className="svc" id="svc">
              {active.featured ? "Онцлох · " : ""}
              {active.category}
            </span>
            <h2 id="svT">{active.title}</h2>
            <p id="svL">{active.lead}</p>
            <a className="svgo" id="svgo" href={`/news/${active.slug}`}>
              Мэдээг унших →
            </a>
          </div>

          <button
            className="svz l"
            id="svl"
            type="button"
            aria-label="Өмнөх стори"
            onClick={() => step(-1)}
          />
          <button
            className="svz r"
            id="svr"
            type="button"
            aria-label="Дараах стори"
            onClick={() => step(1)}
          />
        </div>
      ) : null}
    </div>
  );
}
