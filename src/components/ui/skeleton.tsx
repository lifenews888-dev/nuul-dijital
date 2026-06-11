import { cn } from "@/lib/utils";

/**
 * Shimmering skeleton block. Pure CSS (transform-based shimmer) — no JS,
 * 60fps, and invisible to reduced-motion users (the sweep simply won't run
 * under prefers-reduced-motion via the global CSS reset).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white/[0.04]",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent",
        className
      )}
    />
  );
}

/** A card skeleton matching the portfolio/blog card shape. */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-card">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
