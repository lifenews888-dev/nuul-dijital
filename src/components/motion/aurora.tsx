"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Ambient aurora background — two large brand glows that drift slowly.
 *
 * These used to be solid circles under blur-[140px], animated on x/y/scale.
 * The claim that transform-only animation "never triggers layout/paint" does
 * not hold for a blurred layer: scaling one forces the blur to be rasterised
 * again every frame, and two 140px-kernel layers doing that forever at a
 * phone's pixel ratio is enough to occupy the GPU on its own. Painted as
 * radial gradients there is no filter to redo, so the animation really is
 * just compositing now, and the comment is finally true.
 *
 * Under prefers-reduced-motion (MotionProvider → reducedMotion="user") the
 * glows hold still.
 *
 * Render behind content: <Aurora /> inside a `relative` section.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)} aria-hidden>
      <motion.div
        className="absolute left-[10%] top-[-10%] h-[480px] w-[480px] glow-accent"
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute right-[5%] top-[20%] h-[420px] w-[420px] glow-cyan"
        animate={{ x: [0, -50, 30, 0], y: [0, 30, -30, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}
