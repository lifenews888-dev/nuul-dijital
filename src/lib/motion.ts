import type { Variants, Transition } from "framer-motion";

/**
 * Nuul Digital — central motion tokens.
 * One easing, a small set of durations, and reusable variants so every
 * animation feels like the same hand. Premium = restrained + consistent.
 *
 * Performance rule: animate ONLY `transform` and `opacity` (GPU-composited).
 * Accessibility: pair with <MotionConfig reducedMotion="user"> (see MotionProvider)
 * so Framer Motion neutralizes these for users who request reduced motion.
 */

/** Signature brand easing — a confident, slightly overshooting ease-out. */
export const ease = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

export const duration = {
  fast: 0.2,
  base: 0.3,
  slow: 0.5,
  slower: 0.7,
  reveal: 0.8,
} as const;

export const spring = {
  soft: { type: "spring", stiffness: 200, damping: 25 } as Transition,
  snappy: { type: "spring", stiffness: 380, damping: 30 } as Transition,
  gentle: { type: "spring", stiffness: 120, damping: 20 } as Transition,
};

export const viewportOnce = { once: true, margin: "-80px" } as const;

// ---- Reusable variants ----

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.slow, ease } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slower, ease } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: duration.slow, ease } },
};

/** Parent that staggers its children's entrance. */
export const stagger = (gap = 0.08, delayChildren = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren } },
});

/** Child item to pair with `stagger`. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease } },
};

/** Page-transition variant used by app/template.tsx. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease } },
};
