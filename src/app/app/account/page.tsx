import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { AppAccountPasswordPanel } from "@/components/app/app-account-password-panel";
import { AppPageHeader } from "@/components/app/app-page-header";
import { requireAppUser } from "@/lib/app";
import { db } from "@/lib/db";
import { getCachedSiteFlag } from "@/lib/settings";
import { DomainsMaintenance } from "@/components/domains/domains-maintenance";

export const dynamic = "force-dynamic";

async function isDomainsModuleEnabled(): Promise<boolean> {
  if (process.env.DOMAINS_MODULE_ENABLED === "true") return true;
  const readFlag = getCachedSiteFlag("domains_module_enabled", "false");
  return readFlag();
}

export default async function AppAccountPage() {
  const [enabled, user] = await Promise.all([isDomainsModuleEnabled(), requireAppUser()]);

  if (!enabled) return <DomainsMaintenance />;

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  return (
    <>
      <AppPageHeader
        icon={User}
        titleKey="accountTitle"
        subtitleKey="accountSubtitle"
      />
      <AppAccountPasswordPanel hasPassword={!!record?.passwordHash} />
    </>
  );
}