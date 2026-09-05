import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { AppDashboard } from "@/components/app/app-dashboard";
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

export default async function AppDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; renew?: string }>;
}) {
  const [{ verified, renew }, enabled, user] = await Promise.all([
    searchParams,
    isDomainsModuleEnabled(),
    getAppUser(),
  ]);

  if (!enabled) return <DomainsMaintenance />;

  if (!user) redirect("/app/login");

  return (
    <>
      <AppPageHeader
        icon={LayoutDashboard}
        titleKey="dashboardTitle"
        subtitleKey="dashboardSubtitle"
      />
      <AppDashboard verified={verified === "1"} renewOrderId={renew ?? null} />
    </>
  );
}