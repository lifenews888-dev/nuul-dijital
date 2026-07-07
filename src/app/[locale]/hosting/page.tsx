import { getLocale, getTranslations } from "next-intl/server";
import { ServiceLandingTemplate } from "@/components/services/service-landing-template";
import { HOSTING_PLANS } from "@/data/hosting-plans";
import { buildPlanLabels } from "@/lib/services/plan-labels";
import { getCachedSiteFlag } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function isServiceOrdersEnabled(): Promise<boolean> {
  if (process.env.DOMAINS_SERVICE_ORDERS_ENABLED === "true") return true;
  const readFlag = getCachedSiteFlag("domains_service_orders_enabled", "false");
  return readFlag();
}

export async function generateMetadata() {
  const t = await getTranslations("pages.hosting");
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/hosting",
    keywords: ["хостинг", "hosting", "вэб хостинг", "Монгол"],
  });
}

export default async function HostingPage({
  searchParams,
}: {
  searchParams: Promise<{ journey?: string }>;
}) {
  const [{ journey }, locale, t, ts, ordersEnabled] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations("pages.hosting"),
    getTranslations("services"),
    isServiceOrdersEnabled(),
  ]);

  const planLabels = buildPlanLabels(
    ts,
    "hostingPlans",
    HOSTING_PLANS.map((p) => p.key)
  );

  const journeyQuery = journey ? `?journey=${journey}` : "";

  return (
    <ServiceLandingTemplate
      label={t("label")}
      title={t.rich("title", {
        accent: (c) => <span className="text-gradient-accent">{c}</span>,
      })}
      description={t("description")}
      service="hosting"
      journeyId={journey}
      plans={HOSTING_PLANS}
      planLabels={planLabels}
      plansTitle={t("plansTitle")}
      comingSoonLabel={t("comingSoon")}
      notifyLabel={t("notify")}
      featuredLabel={ts("featured")}
      pricePeriod={ts("pricePeriod")}
      waitlistTitle={ts("waitlist.title")}
      waitlistSubtitle={ts("waitlist.subtitle")}
      primaryCta={{ href: `/domains${journeyQuery}`, label: t("ctaDomains") }}
      secondaryCta={{ href: "/quote", label: t("ctaQuote") }}
      locale={locale}
      ordersEnabled={ordersEnabled}
      orderLabel={ts("orderNow")}
    />
  );
}