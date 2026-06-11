/**
 * Nuul Digital — Design Tokens (source of truth, mirror of tailwind.config + globals.css).
 * Use for non-CSS contexts: OG images, charts, canvas, emails, Figma sync.
 */

export const color = {
  // Brand
  ink: "#0A0A0A",
  paper: "#FFFFFF",
  accent: "#2563EB", // Signal Blue
  accentCyan: "#06B6D4", // Sky
  // Primary scale (Signal Blue)
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB", // brand
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },
  // Secondary scale (Cyan / Sky)
  cyan: {
    50: "#ECFEFF",
    100: "#CFFAFE",
    200: "#A5F3FC",
    300: "#67E8F9",
    400: "#22D3EE",
    500: "#06B6D4", // brand
    600: "#0891B2",
    700: "#0E7490",
    800: "#155E75",
    900: "#164E63",
  },
  // Neutral scale (Steppe)
  neutral: {
    0: "#FFFFFF",
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0A0A0A", // ink
  },
  success: { 50: "#F0FDF4", 500: "#22C55E", 600: "#16A34A", 700: "#15803D" },
  warning: { 50: "#FFFBEB", 500: "#F59E0B", 600: "#D97706", 700: "#B45309" },
  error: { 50: "#FEF2F2", 500: "#EF4444", 600: "#DC2626", 700: "#B91C1C" },
  info: { 50: "#F0F9FF", 500: "#0EA5E9", 600: "#0284C7", 700: "#0369A1" },
} as const;

export const gradient = {
  migration: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
  radialFade: "radial-gradient(ellipse at top, rgba(37,99,235,0.18), transparent 60%)",
} as const;

/** 4px base spacing scale. */
export const space = {
  0: 0, px: 1, 0.5: 2, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32,
  10: 40, 12: 48, 16: 64, 20: 80, 24: 96, 32: 128, 40: 160,
} as const;

export const radius = {
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  base: "0.875rem", // 14px — --radius
  lg: "1rem", // 16px
  xl: "1.25rem", // 20px
  "2xl": "1.75rem", // 28px — cards
  full: "9999px", // pills, avatars
} as const;

export const shadow = {
  xs: "0 1px 2px rgba(0,0,0,0.24)",
  sm: "0 2px 8px rgba(0,0,0,0.30)",
  md: "0 8px 24px rgba(0,0,0,0.36)",
  lg: "0 16px 48px rgba(0,0,0,0.45)",
  xl: "0 24px 64px rgba(0,0,0,0.55)",
  glowAccent: "0 8px 32px rgba(37,99,235,0.30)",
  glowCyan: "0 8px 32px rgba(6,182,212,0.25)",
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 20,
  dropdown: 30,
  overlay: 40,
  navbar: 50,
  modal: 60,
  popover: 70,
  toast: 80,
  cursor: 90,
} as const;

export const breakpoint = {
  sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536, container: 1280,
} as const;

export const motion = {
  duration: { instant: 0.1, fast: 0.2, base: 0.3, slow: 0.5, slower: 0.7, reveal: 0.8 },
  ease: {
    out: [0.22, 1, 0.36, 1], // primary brand easing
    inOut: [0.65, 0, 0.35, 1],
    spring: { type: "spring", stiffness: 380, damping: 30 },
  },
} as const;

export const typography = {
  fontFamily: "Inter, system-ui, sans-serif",
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 },
  readingWidth: { prose: "65ch", narrow: "48ch", wide: "72ch" },
} as const;
