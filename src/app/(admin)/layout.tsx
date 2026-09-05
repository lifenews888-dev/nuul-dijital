import type { Metadata, Viewport } from "next";
import { inter } from "@/lib/fonts";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin — Nuul Digital",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root layout for /admin.
 *
 * Deliberately bare: the admin renders its own chrome in AdminShell, and the
 * marketing shell would work against it — its page transition wraps children in
 * a transformed element, which is the containing block a `position: fixed`
 * sidebar then resolves against, and its <main> would nest inside the admin's
 * own. It also carried the customer AI widget and analytics onto staff pages.
 * The admin uses neither next-intl nor Framer Motion, so nothing here is lost.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={routing.defaultLocale}
      className={`${inter.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
