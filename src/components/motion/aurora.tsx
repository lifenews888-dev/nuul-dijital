"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Ambient aurora background — two large, heavily-blurred brand blobs that
 * drift slowly. Animates ONLY transform (x/y/scale) so it stays composited
 * at 60fps and never triggers layout/paint. Under prefers-reduced-motion
 * (MotionProvider → reducedMotion="user") the blobs hold still.
 *
 * Render behind content: <Aurora /> inside a `relative` section.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)} aria-hidden>
      <motion.div
        className="absolute left-[10%] top-[-10%] h-[480px] w-[480px] rounded-full bg-accent/20 blur-[140px]"
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute right-[5%] top-[20%] h-[420px] w-[420px] rounded-full bg-accent-cyan/15 blur-[140px]"
        animate={{ x: [0, -50, 30, 0], y: [0, 30, -30, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}
