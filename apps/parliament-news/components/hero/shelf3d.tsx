"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  metrics,
  bookPose,
  springStep,
  relIndex,
  type ShelfMetrics,
} from "../../lib/shelf-geometry";
import type { ShelfBook } from "../shelf-model";

/** Тойргийг хаахад шаардагдах хуулбарын тоо (artifact-ийнх) */
const COPIES = 3;
/** Чирэхэд нэг ном солигдох зай — номны өргөнөөр хэмжигдэнэ */
const DRAG_THRESHOLD = 5;
/** Дугуйны хөдөлгөөнийг номоор хөрвүүлэх коэффициент */
const WHEEL_SCALE = 0.5;
/** Дугуй зогссоны дараа хамгийн ойрын ном руу татах хугацаа */
const WHEEL_SETTLE_MS = 160;
/** Хөвөх өргөлт ба налалтын амрах хурд */
const LIFT_K = 12;
const TILT_K = 7;

type Tape = {
  el: HTMLDivElement;
  sp: HTMLDivElement;
  cv: HTMLDivElement;
  bk: HTMLDivElement;
  fe: HTMLDivElement;
  lift: number;
};

/**
 * 3D номын тавиур.
 *
 * Агуулга нь ЭНД БИШ: доорх жагсаалтад SSR-ийн бүтэн мэдээ үлдэнэ. Тавиур нь
 * дүрслэл — ном бүр жинхэнэ `<a href>`-тэй тул анимаци ажиллахгүй байсан ч
 * холбоос ажиллана.
 *
 * Байрлалын бүх тоо `lib/shelf-geometry.ts`-д, тесттэй. Энэ файл нь зөвхөн
 * rAF ба DOM: кадр бүрт React-ийн рендер хийхгүй, transform-ийг элемент рүү
 * шууд бичнэ — 36 номыг секундэд 60 удаа дахин рендерлэх нь тавиурыг зогсооно.
 */
export function Shelf3D({ books }: { books: ShelfBook[] }) {
  const [active, setActive] = useState(0);

  const shelfRef = useRef<HTMLElement | null>(null);
  const tapesRef = useRef<Tape[]>([]);
  const mRef = useRef<ShelfMetrics>(metrics(1, 1280));

  // Байрлал: `s` нь одоогийн бутархай, `T` нь зорилго
  const sRef = useRef(0);
  const tRef = useRef(0);
  const dragRef = useRef<{ x: number; from: number; moved: boolean } | null>(null);
  const tiltRef = useRef({ x: 0, y: 0 });
  const pointerRef = useRef({ x: 0, y: 0 });
  const hoverRef = useRef(-1);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = books.length;
  /**
   * Нэг мэдээтэй үед хуулбар хийхгүй: 3 хуулбар байвал ижил ном гурав
   * харагдаж, тойрог нь өөр дээрээ эргэлдэнэ. `relIndex` нь total ≤ 1 үед
   * үргэлж 0 буцаадаг тул ганц ном төвд нээлттэй зогсоно.
   */
  const total = count <= 1 ? count : count * COPIES;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** `#probe`-оос бодит `--H`-ийг уншиж, талуудын хэмжээг тавина */
  const measure = useCallback(() => {
    const probe = document.getElementById("probe");
    const h = probe ? probe.getBoundingClientRect().height : 0;
    const m = metrics(h, window.innerWidth);
    mRef.current = m;

    // Дөрвөн тал нь ws × H × d хайрцаг үүсгэнэ (artifact-ийн байрлал)
    for (const t of tapesRef.current) {
      if (!t) continue;
      t.sp.style.width = `${m.ws}px`;
      t.sp.style.left = `${-m.ws / 2}px`;
      t.sp.style.transform = `translateZ(${m.d / 2}px)`;

      t.cv.style.width = `${m.d}px`;
      t.cv.style.left = `${-m.d / 2}px`;
      t.cv.style.transform = `rotateY(90deg) translateZ(${m.ws / 2}px)`;

      t.bk.style.width = `${m.d}px`;
      t.bk.style.left = `${-m.d / 2}px`;
      t.bk.style.transform = `rotateY(-90deg) translateZ(${m.ws / 2}px)`;

      t.fe.style.width = `${m.ws * 0.94}px`;
      t.fe.style.left = `${-m.ws * 0.47}px`;
      t.fe.style.transform = `rotateY(180deg) translateZ(${m.d / 2 - 3}px)`;
    }
  }, []);

  useEffect(() => {
    if (count === 0) return;

    // Эхлэх байрлал: дунд хуулбарын эхний ном (нэг мэдээтэй үед 0)
    sRef.current = total > count ? count : 0;
    tRef.current = sRef.current;
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);

    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const m = mRef.current;
      const drag = dragRef.current;

      // Пүрш
      sRef.current = reduced && !drag
        ? tRef.current
        : springStep(sRef.current, tRef.current, dt, Boolean(drag));

      // Тойргийг хаах: хэт холдвол бүхэл эргэлтээр буцаана
      if (sRef.current > total) { sRef.current -= total; tRef.current -= total; }
      if (sRef.current < 0) { sRef.current += total; tRef.current += total; }

      const shelf = shelfRef.current;
      const rect = shelf?.getBoundingClientRect();
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const W = window.innerWidth;
      const settled = Math.abs(tRef.current - sRef.current) < 0.3;

      // Хулганы налалт: хавтасны дээр байхад илүү, бусад үед зөөлөн
      const onCover =
        settled &&
        Math.abs(pointerRef.current.x - W / 2) < 0.55 * m.d &&
        Math.abs(pointerRef.current.y - cy) < 0.55 * m.H;
      const e = 1 - Math.exp(-TILT_K * Math.min(0.05, dt));
      const wantY = reduced
        ? 0
        : onCover
          ? ((pointerRef.current.x - W / 2) / (0.55 * m.d)) * 8
          : ((pointerRef.current.x - W / 2) / W) * 4;
      const wantX = reduced || !onCover ? 0 : (-(pointerRef.current.y - cy) / (m.H / 2)) * 5;
      tiltRef.current.y += (wantY - tiltRef.current.y) * e;
      tiltRef.current.x += (wantX - tiltRef.current.x) * e;

      // Хотын дүрсийн тайз нь тавиуртай хамт найгана
      const cst = document.getElementById("cst");
      if (cst) {
        cst.style.transform =
          `rotateX(${tiltRef.current.x * 0.25}deg) ` +
          `rotateY(${3.5 * Math.sin((sRef.current / count) * 2 * Math.PI) + tiltRef.current.y * 0.5}deg)`;
      }

      for (let v = 0; v < total; v++) {
        const t = tapesRef.current[v];
        if (!t) continue;
        const r = relIndex(v, sRef.current, total);
        const want = v === hoverRef.current && Math.abs(r) > 0.5 ? 1 : 0;
        t.lift += (want - t.lift) * (reduced ? 1 : 1 - Math.exp(-LIFT_K * Math.min(0.05, dt)));

        const p = bookPose({
          index: v,
          s: sRef.current,
          total,
          m,
          lift: t.lift,
          tiltX: tiltRef.current.x,
          tiltY: tiltRef.current.y,
        });

        if (p.hidden) {
          t.el.style.display = "none";
          continue;
        }
        t.el.style.display = "";
        t.el.style.transform =
          `translate3d(${p.x}px,${p.y}px,${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg)`;
        t.el.style.zIndex = String(p.zIndex);
        t.sp.style.setProperty("--shade", String(p.shadeSpine));
        t.cv.style.setProperty("--shade", String(p.shadeCover));
        t.bk.style.setProperty("--shade", String(p.shadeBack));
      }

      const a = ((Math.round(sRef.current) % count) + count) % count;
      setActive((prev) => (prev === a ? prev : a));

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
    };
  }, [count, total, measure, reduced]);

  // Хуруу/хулганы байрлалыг кадрын давталт уншина
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      const d = dragRef.current;
      if (!d) return;
      if (Math.abs(e.clientX - d.x) > DRAG_THRESHOLD) d.moved = true;
      if (d.moved) {
        const m = mRef.current;
        tRef.current = d.from - (e.clientX - d.x) / (m.ws + m.gap);
      }
    };
    addEventListener("pointermove", onMove);
    return () => removeEventListener("pointermove", onMove);
  }, []);

  if (count === 0) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, from: tRef.current, moved: false };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.moved) {
      tRef.current = Math.round(tRef.current);
      e.preventDefault();
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    const m = mRef.current;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    tRef.current += (delta / (m.ws + m.gap)) * WHEEL_SCALE;
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => {
      tRef.current = Math.round(tRef.current);
    }, WHEEL_SETTLE_MS);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); tRef.current -= 1; }
    else if (e.key === "ArrowRight") { e.preventDefault(); tRef.current += 1; }
  };

  const activeBook = books[active];

  return (
    <>
      <section
        className="shelf"
        id="shelf"
        ref={shelfRef}
        aria-label="Сүүлийн мэдээ — сум товчоор эргүүлнэ"
        aria-roledescription="номын тавиур"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <div className="stage" id="stage">
          {Array.from({ length: total }, (_, v) => {
            const book = books[v % count];
            return (
              <div
                className="tape"
                key={v}
                data-v={v}
                onPointerEnter={() => { hoverRef.current = v; }}
                onPointerLeave={() => { if (hoverRef.current === v) hoverRef.current = -1; }}
                ref={(el) => {
                  if (!el) return;
                  const [sp, cv, bk, fe] = Array.from(el.children) as HTMLDivElement[];
                  tapesRef.current[v] = { el, sp, cv, bk, fe, lift: 0 };
                }}
              >
                {/* Нуруу: алтан туузнууд, ангиллын хавтан, kicker, дугаар, тэмдэг */}
                <div
                  className={`f sp th${book.light ? 1 : 0}`}
                  style={{ ["--bg" as string]: book.bg, color: book.fg }}
                >
                  <i className="gb" />
                  <span className="plate">
                    <s>МЭДЭЭ</s>
                    {book.spineLabel}
                  </span>
                  <b>{book.kicker}</b>
                  <em>
                    {book.number}
                    <br />
                    {book.date}
                  </em>
                  <svg className="mk" viewBox="6 48 98 128" aria-hidden="true">
                    <image
                      href={book.light ? "/artifact/logo.png" : "/artifact/logo-white.png"}
                      width="792"
                      height="180"
                    />
                  </svg>
                  <i className="gb" />
                </div>

                {/* Хавтас: кэшлэгдэх SVG (Phase 2-ийн /cover/<slug>) */}
                <div className="f cv" style={{ background: book.bg }}>
                  <img src={book.coverUrl} alt="" width={474} height={900} loading="lazy" decoding="async" />
                  <a href={book.href} aria-label={book.title} />
                </div>

                {/* Ар тал: товч агуулга */}
                <div
                  className="f bk"
                  style={{ ["--bg" as string]: book.bg, color: book.fg }}
                >
                  <div className="bkt">
                    <small>ТОВЧ АГУУЛГА</small>
                    <p>{book.lead}</p>
                    <i />
                  </div>
                </div>

                {/* Хуудасны ирмэг — судалтай градиент, сүүдэргүй */}
                <div className="f fe" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Идэвхтэй мэдээ рүү очих — дэлгэц уншигч ба гарт зориулсан */}
      <a className="sr-only" href={activeBook.href}>
        {activeBook.title}
      </a>
    </>
  );
}
