import { redirect } from "next/navigation";
import { AppDashboard } from "@/components/app/app-dashboard";
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
  searchParams: Promise<{ verified?: string }>;
}) {
  const [{ verified }, enabled, user] = await Promise.all([
    searchParams,
    isDomainsModuleEnabled(),
    getAppUser(),
  ]);

  if (!enabled) return <DomainsMaintenance />;

  if (!user) redirect("/app/login");

  return <AppDashboard verified={verified === "1"} />;
}