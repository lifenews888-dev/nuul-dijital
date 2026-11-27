"use client";

import { useEffect, useRef } from "react";

/**
 * Уншилтын явцын зураас — artifact-ийн `.rprog`.
 *
 * Хуудасны гүйлтээр хэмжинэ, нийтлэлийн биетээр биш: уншигчийн нүдэнд
 * "хэр үлдсэн" нь дэлгэцийн доош явах зай, нэг блокийн урт биш.
 */
export function ReadingProgress() {
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const paint = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 0;
      if (bar.current) bar.current.style.width = `${(pct * 100).toFixed(2)}%`;
    };
    paint();
    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    return () => {
      window.removeEventListener("scroll", paint);
      window.removeEventListener("resize", paint);
    };
  }, []);

  return (
    <div className="rprog" aria-hidden="true">
      <i ref={bar} />
    </div>
  );
}
