"use client";

import { useEffect, useRef, useState } from "react";

export type Slide = {
  url: string;
  caption: string | null;
  video: boolean;
  /**
   * Бүдгэрсэн дэвсгэр (`.bgb`) — artifact-ийн `slideImg()`.
   * Босоо зураг хэвтээ хайрцагт орохдоо хоёр талаараа хар зурвас үлдээдэг;
   * зургийн өөрийнх нь бүдгэрсэн хуулбар түүнийг дүүргэнэ. Хавтсанд
   * хэрэггүй: хавтас нь хайрцагтайгаа ижил харьцаатай.
   */
  blur: boolean;
};

/**
 * Баруун хуудасны зургийн галерей — artifact-ийн `.media`/`.slides`.
 *
 * Гүйлтийн тулгуур (`scroll-snap`) нь хөтөч өөрөө зохицуулдаг тул чирэлтийн
 * код бичээгүй: товч, цэг хоёр нь `scrollTo`-гоор л ажиллана. Идэвхтэй
 * слайдыг гүйлтийн байрлалаас уншина — чирснийг ч, товчилсныг ч нэг адил.
 */
/**
 * Зургийн бодит харьцаа — artifact-ийн `gal()`-ийн `md.dataset.ar`.
 * Босоо зургийг хэвтээ хайрцагт хийвэл хоёр талаар хар зурвас гарна.
 */
function ratioOf(w: number, h: number): string {
  const r = w / Math.max(1, h);
  return r > 1.25 ? "wide" : r < 0.85 ? "tall" : "sq";
}

export function Gallery({ slides, ratio }: { slides: Slide[]; ratio: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [ar, setAr] = useState(ratio);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const read = () => {
      const w = Math.max(1, el.clientWidth);
      setAt(Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / w))));
    };
    el.addEventListener("scroll", read, { passive: true });
    return () => el.removeEventListener("scroll", read);
  }, [slides.length]);

  useEffect(() => {
    if (ratio === "book") return;
    const img = rail.current?.children[at]?.querySelector("img");
    if (img && img.complete && img.naturalWidth) {
      setAr(ratioOf(img.naturalWidth, img.naturalHeight));
    }
  }, [at, ratio]);

  const go = (i: number) => {
    const el = rail.current;
    if (!el) return;
    const k = Math.max(0, Math.min(slides.length - 1, i));
    el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
  };

  const many = slides.length > 1;
  const caption = slides[at]?.caption ?? null;

  /** Хавтас нь үргэлж номын харьцаатай — хэмжих шаардлагагүй. */
  const measure = (e: React.SyntheticEvent<HTMLImageElement>, i: number) => {
    if (i !== at || ratio === "book") return;
    const img = e.currentTarget;
    setAr(ratioOf(img.naturalWidth, img.naturalHeight));
  };

  return (
    <div className="dr">
      <div className="media" data-ar={ar}>
        <div className="slides" ref={rail}>
          {slides.map((s, i) => (
            <div className="slide" key={s.url}>
              {s.video ? (
                <video src={s.url} controls playsInline preload="metadata" />
              ) : (
                <>
                  {s.blur ? (
                    <span
                      className="bgb"
                      style={{ backgroundImage: `url(${JSON.stringify(s.url)})` }}
                    />
                  ) : null}
                  <img
                    className="fg"
                    src={s.url}
                    alt={s.caption ?? ""}
                    loading={i === 0 ? "eager" : "lazy"}
                    onLoad={(e) => measure(e, i)}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {many ? (
          <>
            <button type="button" className="ga p" onClick={() => go(at - 1)} aria-label="Өмнөх зураг">
              ‹
            </button>
            <button type="button" className="ga n" onClick={() => go(at + 1)} aria-label="Дараагийн зураг">
              ›
            </button>
          </>
        ) : null}
      </div>

      {many ? (
        <div className="gnav">
          <span>
            {at + 1} / {slides.length}
          </span>
          <span className="dots">
            {slides.map((s, i) => (
              <button
                key={s.url}
                type="button"
                className={`${s.video ? "v" : ""}${i === at ? " on" : ""}`}
                onClick={() => go(i)}
                aria-label={`${i + 1}-р зураг`}
                aria-current={i === at}
              />
            ))}
          </span>
        </div>
      ) : null}

      {caption ? <p className="fcap">{caption}</p> : null}
    </div>
  );
}
