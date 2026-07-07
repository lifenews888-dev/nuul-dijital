import { redirect } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppSupportPanel } from "@/components/app/app-support-panel";
import { DomainsMaintenance } from "@/components/domains/domains-maintenance";
import { getAppUser } from "@/lib/app";
import { getCachedSiteFlag } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function isDomainsModuleEnabled(): Promise<boolean> {
  if (process.env.DOMAINS_MODULE_ENABLED === "true") return true;
  const readFlag = getCachedSiteFlag("domains_module_enabled", "false");
  return readFlag();
}

export default async function AppSupportPage() {
  const [enabled, user] = await Promise.all([isDomainsModuleEnabled(), getAppUser()]);

  if (!enabled) return <DomainsMaintenance />;
  if (!user) redirect("/app/login");

  return (
    <>
      <AppPageHeader
        icon={LifeBuoy}
        titleKey="supportTitle"
        subtitleKey="supportSubtitle"
      />
      <AppSupportPanel />
    </>
  );
}