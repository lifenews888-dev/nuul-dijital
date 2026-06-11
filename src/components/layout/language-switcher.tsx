"use client";

import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Toggles between Mongolian and English, preserving the current path. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const other = locale === "mn" ? "en" : "mn";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: other })}
      aria-label={other === "en" ? "Switch to English" : "Монгол хэл рүү шилжих"}
      className={
        className ??
        "flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      <Languages className="size-4" />
      {other.toUpperCase()}
    </button>
  );
}
