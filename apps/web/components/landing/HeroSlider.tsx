/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

export interface HeroMediaItem {
  id: string;
  type: string; // "video" | "image"
  url: string;
}

interface Props {
  items: HeroMediaItem[];
  intervalMs?: number;
}

/**
 * Full-bleed background slider for the hero. Crossfades between items.
 * - 0 items: renders nothing (hero shows its own gradient fallback)
 * - 1 item: static, no timer
 * - n items: auto-advance with crossfade. Videos advance on `ended`
 *   if shorter than the interval; otherwise the interval drives it.
 */
export function HeroSlider({ items, intervalMs = 6000 }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [items.length, intervalMs]);

  if (items.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          {item.type === "video" ? (
            <video
              autoPlay
              loop={items.length === 1}
              muted
              playsInline
              className="h-full w-full object-cover"
              // When multiple, advance to next when this video ends
              onEnded={() => {
                if (items.length > 1 && i === active) {
                  setActive((cur) => (cur + 1) % items.length);
                }
              }}
            >
              <source src={item.url} type="video/mp4" />
            </video>
          ) : (
            <img
              src={item.url}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ))}

      {/* Subtle dot indicators when multiple */}
      {items.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
