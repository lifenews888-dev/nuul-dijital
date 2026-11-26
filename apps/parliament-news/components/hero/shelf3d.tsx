"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  metrics,
  bookPose,
  smoothstep,
  springStep,
  relIndex,
  type ShelfMetrics,
} from "../../lib/shelf-geometry";
import { dotTarget, dotStep, nearestIndex, shortestStep } from "../../lib/timeline";
import { wheelStep, clickAction, dragMoved } from "../../lib/shelf-input";
import { ShelfCaption } from "./shelf-caption";
import type { ShelfBook } from "../shelf-model";

/** Тойргийг хаахад шаардагдах хуулбарын тоо (artifact-ийнх) */
const COPIES = 3;
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
  const router = useRouter();
  /**
   * Идэвхтэй мэдээ ба хэдийш хөдөлсөн чиглэл. Чиглэл нь гарчгийн блокийн
   * гүйлгэх тал — artifact-ийн `caption(a, Math.sign(T-s)||1)`.
   */
  const [active, setActive] = useState({ i: 0, dir: 0 });

  const shelfRef = useRef<HTMLElement | null>(null);
  const playRef = useRef<HTMLAnchorElement | null>(null);
  const tapesRef = useRef<Tape[]>([]);
  const mRef = useRef<ShelfMetrics>(metrics(1, 1280));

  // Байрлал: `s` нь одоогийн бутархай, `T` нь зорилго
  const sRef = useRef(0);
  const tRef = useRef(0);
  /**
   * Чирэлтийн төлөв. `id` нь artifact-ийнхтэй ижил зорилготой: хоёр дахь
   * хуруу/заагчийн `pointerdown` эхнийхийнхийг дарж бичвэл тавиур үсэрнэ.
   */
  const dragRef = useRef<{
    id: number;
    x: number;
    from: number;
    moved: boolean;
  } | null>(null);
  /** Чирэлтийн дараах `click`-ийг залгих туг */
  const swallowRef = useRef(false);
  const tiltRef = useRef({ x: 0, y: 0 });
  const pointerRef = useRef({ x: 0, y: 0 });
  const hoverRef = useRef(-1);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Цагийн шугамын цэг. `fracRef` нь кадрын давталтад props уншихгүйн тул:
   * `books` сольвол шинэ массив ирэхэд давталт дахин эхлэхгүй.
   */
  const fractions = useMemo(() => books.map((b) => b.fraction), [books]);
  const fracRef = useRef(fractions);
  fracRef.current = fractions;
  const dpRef = useRef(fractions[0] ?? 0);
  const activeRef = useRef(0);

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
      if (a !== activeRef.current) {
        // Чиглэл: пүршийн явж байгаа тал (artifact-ийн `Math.sign(T-s)||1`)
        const dir = Math.sign(tRef.current - sRef.current) || 1;
        activeRef.current = a;
        setActive({ i: a, dir });
      }

      /**
       * Нээх цагираг (artifact-ийн `.play`): идэвхтэй хавтасны зүүн доод
       * буланд, тавиур ТОГТСОН үед л томорно. Байрлал нь дэлгэцийн өргөн,
       * номын гүнээс хамаардаг тул кадр бүрт бичигдэнэ.
       */
      const play = playRef.current;
      if (play) {
        const ps = smoothstep(
          Math.max(0, Math.min(1, 1 - Math.abs(tRef.current - sRef.current) * 3)),
        );
        play.style.left = `${W / 2 - m.d / 2 - 6}px`;
        play.style.top = `${cy + 0.36 * m.H}px`;
        play.style.transform = `translate(-50%,-50%) scale(${ps})`;
        play.style.visibility = ps < 0.05 ? "hidden" : "visible";
      }

      // Цагийн шугамын цэг — React-гүйгээр шууд DOM руу
      const dot = document.getElementById("dot");
      if (dot) {
        const target = dotTarget(fracRef.current, sRef.current);
        dpRef.current = reduced
          ? target
          : dotStep(dpRef.current, target, Math.min(0.05, dt));
        dot.style.left = `${dpRef.current * 100}%`;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
    };
  }, [count, total, measure, reduced]);

  /**
   * Цагийн шугам дээр дарахад хамгийн ойрын мэдээ руу, тойргийн богино
   * замаар (artifact index.html:972). `#hit` нь серверээс ирсэн элемент тул
   * `id`-аар холбоно — `Timeline` нь client component болгохгүй.
   */
  useEffect(() => {
    const hit = document.getElementById("hit");
    const tl = document.getElementById("tl");
    if (!hit || !tl) return;
    const onClick = (e: MouseEvent) => {
      const r = tl.getBoundingClientRect();
      if (r.width === 0) return;
      const f = (e.clientX - r.left) / r.width;
      const j = nearestIndex(fracRef.current, f);
      tRef.current = Math.round(tRef.current) + shortestStep(activeRef.current, j, count);
    };
    hit.addEventListener("click", onClick);
    return () => hit.removeEventListener("click", onClick);
  }, [count]);

  /**
   * Заагчийн хөдөлгөөн БА суллалт хоёулаа ЦОНХОНД сонсогдоно.
   *
   * `.shelf` нь дэлгэцийн дунд хэвтээ зурвас (`height: var(--H) + 100px`).
   * Суллалтыг зөвхөн тэр элемент дээр сонсвол хэрэглэгч чирч яваад гарчиг
   * эсвэл виджет рүү оролоо гэхэд `pointerup` ирэхгүй: чирэлт цэвэрлэгдэхгүй
   * үлдэж, товч даралгүй хулгана хөдөлгөхөд тавиур эргэлдсээр байна.
   * Artifact ч цонхонд сонсдог (index.html:908).
   */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      if (dragMoved(d.x, e.clientX)) d.moved = true;
      if (d.moved) {
        const m = mRef.current;
        tRef.current = d.from - (e.clientX - d.x) / (m.ws + m.gap);
      }
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      dragRef.current = null;
      if (!d.moved) return;
      tRef.current = Math.round(tRef.current);
      /**
       * Чирэлтийн дараах `click`-ийг залгина. `pointerup` дээрх
       * `preventDefault()` нь `click`-ийг ЗОГСООДОГГҮЙ (Pointer Events-ийн
       * нийцлийн дүрэм), харин хавтасны `<a>` нь бүх нүүрийг хучдаг тул
       * богино чирэлт мэдээг нээчихнэ.
       */
      swallowRef.current = true;
      setTimeout(() => {
        swallowRef.current = false;
      }, 0);
    };

    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onUp);
    return () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onUp);
    };
  }, []);

  /**
   * Дугуй: React-ийн `onWheel` нь PASSIVE-ээр бүртгэгддэг тул
   * `preventDefault()` боломжгүй. Artifact-ийн хоёр хамгаалалт
   * (`lib/shelf-input.ts`) энд хэрэгжинэ — нүүрээс доош гүйлгэхэд тавиур
   * нэгэн зэрэг эргэлдэхгүй.
   */
  useEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf) return;
    const onWheel = (e: WheelEvent) => {
      const m = mRef.current;
      const r = shelf.getBoundingClientRect();
      const step = wheelStep(e, {
        scrollY: window.scrollY,
        pointerY: e.clientY,
        top: r.top,
        bottom: r.bottom,
        step: m.ws + m.gap,
      });
      if (step === null) return;
      e.preventDefault();
      tRef.current += step;
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        tRef.current = Math.round(tRef.current);
      }, WHEEL_SETTLE_MS);
    };
    shelf.addEventListener("wheel", onWheel, { passive: false });
    return () => shelf.removeEventListener("wheel", onWheel);
  }, []);

  if (count === 0) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    // Нэг л заагч чирнэ: хоёр дахь нь эхнийхийн эхлэлийг дарж бичвэл үсэрнэ
    if (dragRef.current) return;
    dragRef.current = { id: e.pointerId, x: e.clientX, from: tRef.current, moved: false };
  };

  /**
   * Ном дээр дарах — artifact-ийн `index.html:906`.
   *
   * Урдах ном бол мэдээг нээнэ (хавтасны `<a>` өөрөө хийнэ), хөрш ном бол
   * түүнийг урагш эргүүлнэ: хөрш дээр дарахад юу ч болохгүй байх нь номын
   * тавиурын хамгийн ойлгомжтой үйлдлийг үхүүлнэ. Чирэлтийн дараах
   * `click`-ийг мөн энд залгина.
   */
  const onClickCapture = (e: React.MouseEvent) => {
    if (swallowRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const tape = (e.target as HTMLElement | null)?.closest("[data-v]");
    if (!(tape instanceof HTMLElement)) return;
    const v = Number(tape.dataset.v);
    if (!Number.isInteger(v)) return;
    const action = clickAction(relIndex(v, sRef.current, total));
    if (action.kind === "open") return; // хавтасны холбоос өөрөө аваачна
    e.preventDefault();
    e.stopPropagation();
    tRef.current = Math.round(tRef.current) + action.by;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); tRef.current -= 1; }
    else if (e.key === "ArrowRight") { e.preventDefault(); tRef.current += 1; }
    else if (e.key === "Enter" || e.key === " ") {
      // Гараар тавиурыг эргүүлсэн хүн мэдээг нээх ёстой — хулганаар
      // хавтас дээр дарахтай ижил
      e.preventDefault();
      router.push(books[activeRef.current % count].href);
    }
  };

  const activeBook = books[active.i];
  const nudge = (step: number) => () => { tRef.current = Math.round(tRef.current) + step; };

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
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        aria-describedby="shelf-hint"
      >
        {/*
          Тавиур нь ДҮРСЛЭЛ: тойрог нэг мэдээг гурав агуулдаг тул нуруу,
          ар талын товч агуулга бүгд хүртээмжийн модонд орвол дэлгэц
          уншигч нэг гарчгийг гурав уншина. Хүртээмжтэй хувилбар нь доорх
          `sr-only` холбоос ба `aria-live` гарчгийн блок.
        */}
        <div className="stage" id="stage" aria-hidden="true">
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
                  {/*
                    Хулганы холбоос, гарын биш: `.stage` нь бүхэлдээ
                    `aria-hidden` тул дэлгэц уншигчид хүрэхгүй, гар нь
                    `.shelf` дээр зогсоод сум/Enter-ээр ажиллана.
                  */}
                  <a href={book.href} aria-label={book.title} tabIndex={-1} />
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

      {/* Нээх цагираг — хавтас дээр дарахтай ижил, зүгээр л томоор */}
      <a
        className="play"
        id="play"
        ref={playRef}
        href={activeBook.href}
        aria-label={`Мэдээг нээх: ${activeBook.title}`}
        tabIndex={-1}
      />

      <ShelfCaption book={activeBook} dir={active.dir} />

      <button className="arr p" type="button" id="prev" aria-label="Өмнөх мэдээ" onClick={nudge(-1)}>
        <svg width="24" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <path d="M6 1L1 6l5 5M1 6h23" />
        </svg>
      </button>
      <button className="arr n" type="button" id="next" aria-label="Дараах мэдээ" onClick={nudge(1)}>
        <svg width="24" height="12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <path d="M18 1l5 5-5 5M23 6H0" />
        </svg>
      </button>

      {/* Идэвхтэй мэдээ рүү очих — дэлгэц уншигч ба гарт зориулсан */}
      <a className="sr-only" href={activeBook.href}>
        {activeBook.title}
      </a>
      <span className="sr-only" id="shelf-hint">
        Зүүн, баруун сумаар мэдээ сольж, Enter дарж нээнэ.
      </span>
    </>
  );
}
