"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { revealDelay } from "../../lib/motion";

/**
 * Гүйлгэхэд илчлэгдэх бүрхүүл.
 *
 * `prefers-reduced-motion: reduce` үед ажиглагч ОГТ үүсэхгүй ба эхний
 * төлөв нь ИЛ: хөдөлгөөн хаасан хүн агуулгыг шууд харна. Нийтлэг алдаа
 * нь анимацийг унтраахдаа `opacity:0`-ийг үлдээж, агуулгыг бүрмөсөн
 * далдлах — тэр нь хөдөлгөөн багасгахгүй, сайтыг эвдэнэ.
 *
 * JS ажиллахгүй үед ч мөн адил: далдлах ангийг зөвхөн хөтөч дээр тавина.
 */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    setArmed(true);

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = [className, armed ? "rv" : null, armed && shown ? "in" : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={cls || undefined}
      style={armed ? { transitionDelay: `${revealDelay(index)}ms` } : undefined}
    >
      {children}
    </div>
  );
}
