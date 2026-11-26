"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../icon";
import type { ShelfBook } from "../shelf-model";

/** Artifact-ийн `swap()` (index.html:785) */
const DURATION = 650;
const EASING = "cubic-bezier(.2,.8,.2,1)";
/** Хуучин ба шинэ мөр хэр зайгаар гүйж орох — хувиар */
const TRAVEL = 105;

type Lines = { t: ReactNode; s: ReactNode; y: ReactNode; l: ReactNode };

/** Нэг мэдээний дөрвөн мөр */
function lines(b: ShelfBook): Lines {
  return {
    t: b.title,
    s: (
      <span className="lbl">
        {b.featured ? (
          <>
            <b className="fbad">
              <Icon name="star" /> ОНЦЛОХ
            </b>{" "}
          </>
        ) : null}
        {b.spineLabel.toUpperCase()} · PARLIAMENT NEWS
      </span>
    ),
    y: `${b.dateFull} — ${b.spineLabel}`,
    l: b.lead,
  };
}

type State = { cur: ShelfBook; out: ShelfBook | null; dir: number };

/**
 * Тавиурын идэвхтэй мэдээний гарчгийн блок.
 *
 * Artifact-ийн `swap()` нь шинэ `<span>`-г нэмж, хуучныг эсрэг тийш гүйлгэж
 * хаядаг. Энд тэр хоёр мөр ХОЁУЛАА React-ийн төлөвт байна: `out` нь гарч
 * байгаа мэдээ, `cur` нь орж байгаа. Хоёр нь `.m > span { grid-area: 1/1 }`
 * -аар дээр дээрээ тавигдаж, Web Animations API-гаар гүйнэ. Ингэснээр
 * серверээс ирсэн HTML-д эхний мэдээ аль хэдийн байх ба React-ийн мэдэхгүй
 * DOM үлдэхгүй.
 */
export function ShelfCaption({ book, dir }: { book: ShelfBook; dir: number }) {
  const [state, setState] = useState<State>({ cur: book, out: null, dir: 0 });
  const capRef = useRef<HTMLDivElement | null>(null);

  // Шинэ мэдээ ирэхэд хуучныг гарахаар тэмдэглэнэ (рендерийн үеийн шинэчлэл:
  // эффектээр хийвэл нэг кадрын турш хуучин гарчиг харагдана)
  if (state.cur !== book) {
    setState({ cur: book, out: state.cur, dir });
  }

  useEffect(() => {
    if (state.out === null) return;
    const el = capRef.current;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Чиглэлгүй (эхний удаа) эсвэл хөдөлгөөн багасгасан үед шууд солино
    if (!el || reduced || state.dir === 0) {
      setState((s) => (s.out === null ? s : { ...s, out: null }));
      return;
    }

    const options: KeyframeAnimationOptions = {
      duration: DURATION,
      easing: EASING,
      fill: "both",
    };
    const d = state.dir;
    el.querySelectorAll<HTMLElement>("span[data-in]").forEach((sp) => {
      sp.animate(
        [{ transform: `translateY(${d * TRAVEL}%)` }, { transform: "translateY(0)" }],
        options,
      );
    });
    el.querySelectorAll<HTMLElement>("span[data-out]").forEach((sp) => {
      sp.animate(
        [{ transform: "translateY(0)" }, { transform: `translateY(${-d * TRAVEL}%)` }],
        options,
      );
    });

    const timer = setTimeout(() => {
      setState((s) => (s.out === null ? s : { ...s, out: null }));
    }, DURATION);
    return () => clearTimeout(timer);
  }, [state]);

  const cur = lines(state.cur);
  const out = state.out ? lines(state.out) : null;

  const row = (cls: string, id: string, key: keyof Lines) => (
    <div className={`m ${cls}`} id={id}>
      {out ? (
        <span data-out="" key={`${state.out?.href}-out`}>
          {out[key]}
        </span>
      ) : null}
      <span data-in="" key={`${state.cur.href}-in`}>
        {cur[key]}
      </span>
    </div>
  );

  return (
    <div className="cap" aria-live="polite" ref={capRef}>
      {row("ct", "cT", "t")}
      {row("cs", "cS", "s")}
      <div className="rl" />
      {row("cy", "cY", "y")}
      {row("cl", "cL", "l")}
    </div>
  );
}
