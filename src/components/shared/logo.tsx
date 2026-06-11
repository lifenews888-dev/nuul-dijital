import { cn } from "@/lib/utils";

/**
 * Nuul Digital — Migration Mark.
 * The "N" is drawn as a migration path between two nodes: an origin (bottom-left)
 * and a destination (top-right). The accent gradient runs along the direction of
 * travel — manual → modern, нүүдэл → үүл (migration → cloud).
 */
export function LogoMark({
  className,
  size = 36,
  live = false,
}: {
  className?: string;
  size?: number;
  /** Show the small "online/live" node — used in the product nav. */
  live?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="nuul-grad" x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {/* glyph plate */}
        <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" fill="url(#nuul-grad)" />
        {/* migration path forming the N: origin (bottom-left) → destination (top-right) */}
        <path
          d="M12 29V12L28 29V12"
          stroke="white"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* destination node */}
        <circle cx="28" cy="12" r="2.6" fill="white" />
      </svg>
      {live && (
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent-cyan ring-2 ring-background" />
      )}
    </span>
  );
}

/**
 * Full lockup. When `src` is provided (admin-uploaded logo), it renders that
 * image instead of the built-in mark + wordmark. Otherwise falls back to the
 * vector Migration Mark + "nuul." wordmark.
 */
export function Logo({
  className,
  size = 36,
  showText = true,
  live = false,
  src,
}: {
  className?: string;
  size?: number;
  showText?: boolean;
  live?: boolean;
  /** Admin-uploaded logo URL (overrides the vector mark). */
  src?: string | null;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Nuul Digital"
        height={size}
        style={{ height: size, width: "auto" }}
        className={cn("w-auto object-contain", className)}
      />
    );
  }
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} live={live} />
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          nuul<span className="text-accent">.</span>
        </span>
      )}
    </span>
  );
}
