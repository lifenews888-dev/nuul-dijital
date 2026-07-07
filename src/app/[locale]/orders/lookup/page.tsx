import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { OrderLookupPanel } from "@/components/orders/order-lookup-panel";
import { PageHeader } from "@/components/shared/page-header";
import { DomainsMaintenance } from "@/components/domains/domains-maintenance";
import {
  ORDER_LOOKUP_COOKIE,
  verifySessionToken,
} from "@/lib/domains/order-lookup";
import { getCachedSiteFlag } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("pages.ordersLookup");
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/orders/lookup",
    keywords: ["захиалга", "order lookup", "домэйн захиалга", "domain order"],
  });
}

async function isDomainsModuleEnabled(): Promise<boolean> {
  if (process.env.DOMAINS_MODULE_ENABLED === "true") return true;
  const readFlag = getCachedSiteFlag("domains_module_enabled", "false");
  return readFlag();
}

export default async function OrdersLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string }>;
}) {
  const [{ verified, error }, locale, enabled, t] = await Promise.all([
    searchParams,
    getLocale(),
    isDomainsModuleEnabled(),
    getTranslations("pages.ordersLookup"),
  ]);

  if (!enabled) {
    return <DomainsMaintenance />;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ORDER_LOOKUP_COOKIE)?.value;
  const initialEmail = token ? verifySessionToken(token) : null;

  return (
    <>
      <PageHeader
        label={t("label")}
        title={t.rich("title", {
          accent: (c) => <span className="text-gradient-accent">{c}</span>,
        })}
        description={t("description")}
      />
      <section className="container-wide pb-20">
        <OrderLookupPanel
          initialEmail={initialEmail}
          verified={verified === "1"}
          error={error ?? null}
          locale={locale}
        />
      </section>
    </>
  );
}