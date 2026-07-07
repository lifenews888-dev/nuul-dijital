"use client";

import { usePathname } from "next/navigation";

/** Renders children on marketing routes only (admin and /app have their own chrome). */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/app")) return null;
  return <>{children}</>;
}
