"use client";

import { usePathname } from "next/navigation";

/** Renders children on all routes except the /admin area (which has its own chrome). */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
