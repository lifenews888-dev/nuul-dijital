import { getLocale, getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";
import { ServiceLandingTemplate } from "@/components/services/service-landing-template";
import { EMAIL_PLANS } from "@/data/hosting-plans";
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
  const t = await getTranslations("pages.businessEmail");
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/business-email",
    keywords: ["бизнес имэйл", "business email", "name@company.mn"],
  });
}

export default async function BusinessEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ journey?: string }>;
}) {
  const [{ journey }, locale, t, ts, ordersEnabled] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations("pages.businessEmail"),
    getTranslations("services"),
    isServiceOrdersEnabled(),
  ]);

  const planLabels = buildPlanLabels(
    ts,
    "emailPlans",
    EMAIL_PLANS.map((p) => p.key)
  );

  const journeyQuery = journey ? `?journey=${journey}` : "";

  return (
    <ServiceLandingTemplate
      label={t("label")}
      title={t.rich("title", {
        accent: (c) => <span className="text-gradient-accent">{c}</span>,
      })}
      description={t("description")}
      service="email"
      journeyId={journey}
      plans={EMAIL_PLANS}
      planLabels={planLabels}
      plansTitle={t("plansTitle")}
      comingSoonLabel={t("comingSoon")}
      notifyLabel={t("notify")}
      featuredLabel={ts("featured")}
      pricePeriod={ts("pricePeriod")}
      highlight={
        <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-transparent to-accent-cyan/5 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Mail className="size-7" />
          </div>
          <p className="mt-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t("highlightLabel")}
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-gradient-accent">{t("highlightExample")}</span>
          </p>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t("highlightBody")}</p>
        </div>
      }
      hostingNote={t("hostingNote")}
      waitlistTitle={ts("waitlist.title")}
      waitlistSubtitle={ts("waitlist.subtitle")}
      primaryCta={{ href: `/hosting${journeyQuery}`, label: t("ctaHosting") }}
      secondaryCta={{ href: `/domains${journeyQuery}`, label: t("ctaDomains") }}
      locale={locale}
      ordersEnabled={ordersEnabled}
      orderLabel={ts("orderNow")}
    />
  );
}