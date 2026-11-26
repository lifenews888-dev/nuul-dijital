"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import styles from "./shelf.module.css";
import type { ShelfBook } from "./shelf-model";

/**
 * Хөрш номнуудын хэвтээ зай — номын ӨРГӨНИЙ үржвэрээр.
 *
 * px биш учир нь номын өргөн нь CSS-д `clamp(116px, 33vw, 190px)` — утсан
 * дээр жижигрэх ёстой. Зайг px-ээр бичвэл жижиг дэлгэцэд номнууд хэт
 * тарж, эсвэл давхарлана.
 */
const GAP_RATIO = 0.62;
/** Хажуу тийш хэдэн зэрэг эргэх */
const SIDE_ROTATION = 32;
/** Хөрш бүрийн гүний зай (px) */
const DEPTH = 130;
/** Чирэхэд нэг ном солигдох зай (px) */
const DRAG_PER_BOOK = 90;
/** Энэ тооноос цаад номнууд харагдахгүй */
const VISIBLE_SIDE = 4;

/**
 * 3D номын тавиур.
 *
 * Агуулга нь ЭНД БИШ: доорх `<section>`-д SSR-ийн бүтэн жагсаалт үлдэнэ.
 * Тавиур нь дүрслэл — JS унтарсан ч, робот ч мэдээг жагсаалтаас уншина.
 * Эхний рендер нь props-оос шууд HTML гаргадаг тул хавтаснууд SSR-д ч
 * харагдана; зөвхөн эргэлт, чирэлт нь hydrate-ийн дараа ажиллана.
 */
export function Shelf({ books }: { books: ShelfBook[] }) {
  const [active, setActive] = useState(0);
  const drag = useRef<{ x: number; from: number } | null>(null);

  const move = useCallback(
    (delta: number) => {
      setActive((i) => Math.min(books.length - 1, Math.max(0, i + delta)));
    },
    [books.length],
  );

  // Хөтчийн анхдагч гүйлтийг зөвхөн хэвтээ хөдөлгөөнд хаана
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      move(e.deltaX > 0 ? 1 : -1);
    },
    [move],
  );

  if (books.length === 0) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, from: active };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const steps = Math.round((d.x - e.clientX) / DRAG_PER_BOOK);
    setActive(Math.min(books.length - 1, Math.max(0, d.from + steps)));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(-1);
    }
  };

  const current = books[active];

  return (
    <div>
      <div
        className={styles.shelf}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
        aria-roledescription="номын тавиур"
        aria-label="Сүүлийн мэдээ — сум товчоор эргүүлнэ"
      >
        <ul className={styles.stage}>
          {books.map((book, i) => {
            const offset = i - active;
            const away = Math.abs(offset);
            const hidden = away > VISIBLE_SIDE;
            return (
              <li
                key={book.href}
                className={styles.tape}
                data-active={i === active}
                style={
                  {
                    "--bg": book.bg,
                    "--fg": book.fg,
                    zIndex: 100 - away,
                    // Хэвтээ зай нь номын өргөнөөс хамаарна (CSS хувьсагч)
                    transform: `translate3d(calc(var(--bw) * ${(offset * GAP_RATIO).toFixed(3)}), 0, ${
                      -away * DEPTH
                    }px) rotateY(${
                      offset === 0 ? 0 : offset > 0 ? -SIDE_ROTATION : SIDE_ROTATION
                    }deg)`,
                    opacity: hidden ? 0 : 1,
                    pointerEvents: hidden ? "none" : undefined,
                  } as React.CSSProperties
                }
              >
                <div className={styles.spine} aria-hidden="true">
                  <span className={styles.plate}>{book.spineLabel}</span>
                  <span className={styles.spineText}>{book.kicker}</span>
                  <span className={styles.plate}>
                    {book.number} · {book.date}
                  </span>
                </div>
                <div className={styles.cover}>
                  {/* Хавтас нь кэшлэгдэх SVG. next/image БИШ: SVG нь вектор,
                      дахин кодлох, srcset гаргах зүйлгүй. */}
                  <img
                    src={book.coverUrl}
                    alt=""
                    width={474}
                    height={900}
                    loading={away > 1 ? "lazy" : "eager"}
                    decoding="async"
                  />
                  <Link href={book.href} className={styles.link}>
                    <span className={styles.srOnly}>{book.title}</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Гарчиг нь 3D талбайн ГАДНА, энгийн урсгалд — номнууд дээр давхарлахгүй */}
      <p className={styles.caption} aria-hidden="true">
        <span className={styles.captionKicker}>{current.spineLabel}</span>{" "}
        <span className={styles.captionTitle}>{current.title}</span>
      </p>
    </div>
  );
}
