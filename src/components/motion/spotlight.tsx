"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pointer-tracking spotlight. Sets CSS custom properties (--mx/--my) that the
 * `.card-glow` utility (globals.css) reads to position a soft radial highlight.
 * No re-renders, no JS animation loop — just two style writes on pointermove.
 *
 * Usage: <Spotlight className="card-glow rounded-3xl border ...">…</Spotlight>
 */
export function Spotlight({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  const Comp = Tag as React.ElementType;
  function onMove(e: React.PointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <Comp onPointerMove={onMove} className={cn("card-glow", className)}>
      {children}
    </Comp>
  );
}
