import { NextIntlClientProvider } from "next-intl";
import { organizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HideOnAdmin } from "@/components/layout/hide-on-admin";
import { MotionProvider } from "@/components/motion/motion-provider";
import { PageTransition } from "@/components/motion/page-transition";
import { Analytics } from "@/components/shared/analytics";
import { AiAssistant } from "@/components/shared/ai-assistant";
import { getLogoUrl } from "@/lib/settings";
import { getServices } from "@/lib/content";

/**
 * Everything inside <body> that every area of the site shares.
 *
 * This lives in a component rather than in one root layout because the public
 * site and the signed-in areas now have separate root layouts: the public one
 * takes its locale from the [locale] segment, which is what keeps it
 * statically renderable, while /admin and /app render at request time.
 */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [logoUrl, services] = await Promise.all([getLogoUrl(), getServices()]);

  return (
    <NextIntlClientProvider>
      <JsonLd data={organizationJsonLd()} />
      <MotionProvider>
        <Navbar logoUrl={logoUrl} services={services} />
        <main className="relative">
          <PageTransition>{children}</PageTransition>
        </main>
        <HideOnAdmin>
          <Footer logoUrl={logoUrl} />
        </HideOnAdmin>
      </MotionProvider>
      <AiAssistant />
      <Analytics />
    </NextIntlClientProvider>
  );
}
