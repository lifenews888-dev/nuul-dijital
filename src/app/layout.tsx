import type { Metadata, Viewport } from "next";
import { inter } from "@/lib/fonts";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HideOnAdmin } from "@/components/layout/hide-on-admin";
import { MotionProvider } from "@/components/motion/motion-provider";
import { PageTransition } from "@/components/motion/page-transition";
import { Analytics } from "@/components/shared/analytics";
import { AiAssistant } from "@/components/shared/ai-assistant";
import { getLogoUrl } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuul.digital"),
  ...buildMetadata(),
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const logoUrl = await getLogoUrl();
  return (
    <html lang="mn" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <JsonLd data={organizationJsonLd()} />
        <MotionProvider>
          <Navbar logoUrl={logoUrl} />
          <main className="relative">
            <PageTransition>{children}</PageTransition>
          </main>
          <HideOnAdmin>
            <Footer logoUrl={logoUrl} />
          </HideOnAdmin>
        </MotionProvider>
        <AiAssistant />
        <Analytics />
      </body>
    </html>
  );
}
