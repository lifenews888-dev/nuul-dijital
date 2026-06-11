"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ease, duration } from "@/lib/motion";

/**
 * Subtle page transition. Keyed by pathname so each client navigation fades in.
 *
 * The FIRST render is intentionally NOT animated (`initial={false}`) so the
 * server-rendered content paints immediately — no opacity:0 flash, no LCP hit.
 * Reduced-motion users get an instant cut (handled by MotionConfig).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const first = useRef(true);
  const isFirst = first.current;
  first.current = false;

  return (
    <motion.div
      key={pathname}
      initial={isFirst ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease }}
    >
      {children}
    </motion.div>
  );
}
