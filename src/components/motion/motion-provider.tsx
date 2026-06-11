"use client";

import { MotionConfig } from "framer-motion";
import { ease } from "@/lib/motion";

/**
 * App-wide motion configuration.
 *
 * `reducedMotion="user"` makes EVERY Framer Motion animation automatically
 * respect the OS "Reduce motion" setting — transform/opacity tweens are
 * neutralized without us touching each component. This is the single most
 * important accessibility lever for the motion system.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease, duration: 0.4 }}>
      {children}
    </MotionConfig>
  );
}
