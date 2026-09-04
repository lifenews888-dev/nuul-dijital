import type { Metadata, Viewport } from "next";
import { inter } from "@/lib/fonts";
import { routing } from "@/i18n/routing";
import { SiteChrome } from "@/components/layout/site-chrome";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://nuul.digital"),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root layout for the signed-in areas (/admin, /app).
 *
 * These routes sit outside the [locale] segment and always render at request
 * time, so the language is fixed to the default rather than resolved per
 * request; each area layers its own chrome on top via SiteChrome's children.
 */
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={routing.defaultLocale}
      className={`${inter.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
