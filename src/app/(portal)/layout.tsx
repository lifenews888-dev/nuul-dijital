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
 * Root layout for the customer portal (/app).
 *
 * It sits outside the [locale] segment and always renders at request time, so
 * the language is fixed to the default rather than resolved per request. The
 * portal keeps the marketing chrome — navbar, footer, assistant — which is why
 * it has its own group separate from /admin.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
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
