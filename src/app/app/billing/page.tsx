import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { AppBillingPanel } from "@/components/app/app-billing-panel";
import { AppPageHeader } from "@/components/app/app-page-header";
import { getAppUser } from "@/lib/app";
import { getCachedSiteFlag } from "@/lib/settings";
import { DomainsMaintenance } from "@/components/domains/domains-maintenance";

export const dynamic = "force-dynamic";

async function isDomainsModuleEnabled(): Promise<boolean> {
  if (process.env.DOMAINS_MODULE_ENABLED === "true") return true;
  const readFlag = getCachedSiteFlag("domains_module_enabled", "false");
  return readFlag();
}

export default async function AppBillingPage() {
  const [enabled, user] = await Promise.all([isDomainsModuleEnabled(), getAppUser()]);

  if (!enabled) return <DomainsMaintenance />;
  if (!user) redirect("/app/login");

  return (
    <>
      <AppPageHeader
        icon={CreditCard}
        titleKey="billingTitle"
        subtitleKey="billingSubtitle"
      />
      <AppBillingPanel />
    </>
  );
}