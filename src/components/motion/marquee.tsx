"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Infinite horizontal marquee. Renders children twice for a seamless loop. */
export function Marquee({
  children,
  className,
  reverse = false,
  speed = 40,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  speed?: number;
}) {
  return (
    <div className={cn("group flex w-full overflow-hidden mask-fade-x", className)}>
      <div
        className="flex shrink-0 items-center gap-12 pr-12 animate-marquee group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 items-center gap-12 pr-12 animate-marquee group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
      </div>
    </div>
  );
}
