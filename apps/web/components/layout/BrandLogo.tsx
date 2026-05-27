"use client";

import { useEffect, useState } from "react";

interface Props {
  className?: string;
  suffixClassName?: string;
}

/**
 * Brand text logo. Reads `site_name` from /api/footer (cached server-side)
 * and renders it with the last dot-suffix coloured by `suffixClassName`.
 *
 * Examples:
 *   site_name = "nuul.digital" → nuul + .digital (colored)
 *   site_name = "Acme"         → Acme (no split)
 *   site_name = "my.brand.io"  → my.brand + .io (colored)
 */
export function BrandLogo({
  className = "",
  suffixClassName = "text-v-soft",
}: Props) {
  const [name, setName] = useState<string>("nuul.digital");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/footer")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.siteName) setName(d.siteName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === name.length - 1) {
    return <span className={className}>{name}</span>;
  }
  const base = name.slice(0, dotIndex);
  const suffix = name.slice(dotIndex);

  return (
    <span className={className}>
      {base}
      <span className={suffixClassName}>{suffix}</span>
    </span>
  );
}
