import { getLocale, getTranslations } from "next-intl/server";
import { Shield } from "lucide-react";
import { ServiceLandingTemplate } from "@/components/services/service-landing-template";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("pages.ssl");
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/ssl",
    keywords: ["SSL", "HTTPS", "аюулгүй байдал", "Let's Encrypt"],
  });
}

export default async function SslPage({
  searchParams,
}: {
  searchParams: Promise<{ journey?: string }>;
}) {
  const [{ journey }, locale, t, ts] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations("pages.ssl"),
    getTranslations("services"),
  ]);

  const features = ts.raw("sslFeatures") as string[];
  const journeyQuery = journey ? `?journey=${journey}` : "";

  return (
    <ServiceLandingTemplate
      label={t("label")}
      title={t.rich("title", {
        accent: (c) => <span className="text-gradient-accent">{c}</span>,
      })}
      description={t("description")}
      service="ssl"
      journeyId={journey}
      planLabels={{}}
      comingSoonLabel={t("comingSoon")}
      notifyLabel={t("notify")}
      featuredLabel={ts("featured")}
      pricePeriod={ts("pricePeriod")}
      highlight={
        <div className="rounded-3xl border border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/10 via-transparent to-accent/5 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-cyan/10 text-accent-cyan">
            <Shield className="size-7" />
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight">{t("freeTitle")}</p>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{t("freeBody")}</p>
        </div>
      }
      features={features}
      featuresTitle={t("featuresTitle")}
      hostingNote={t("hostingNote")}
      waitlistTitle={ts("waitlist.title")}
      waitlistSubtitle={t("waitlist.subtitleSsl")}
      primaryCta={{ href: `/hosting${journeyQuery}`, label: t("ctaHosting") }}
      secondaryCta={{ href: `/domains${journeyQuery}`, label: t("ctaDomains") }}
      locale={locale}
    />
  );
}