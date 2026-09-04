import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { inter } from "@/lib/fonts";
import { buildMetadata } from "@/lib/seo";
import { routing, type Locale } from "@/i18n/routing";
import { SiteChrome } from "@/components/layout/site-chrome";
import "../../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://nuul.digital"),
  ...buildMetadata(),
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Root layout for the public site.
 *
 * `lang` comes from the route segment rather than from getLocale(). Reading the
 * locale off the request headers here opted the entire tree into dynamic
 * rendering — no page was prerendered, so every view round-tripped to the
 * origin region instead of being served from the nearest edge.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  // Opt this segment into static rendering for the active locale.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
