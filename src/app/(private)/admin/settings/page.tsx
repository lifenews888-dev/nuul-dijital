import { requireUser } from "@/lib/admin";
import { getBankSettings } from "@/lib/domains/bank-settings";
import { getLogoUrl, getVercelConfig } from "@/lib/settings";
import { AdminHeader } from "@/components/admin/ui";
import { BankSettingsForm } from "@/components/admin/bank-settings";
import { LogoSettings } from "@/components/admin/logo-settings";
import { VercelSettings } from "@/components/admin/vercel-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireUser();
  const [logoUrl, vercel, bank] = await Promise.all([getLogoUrl(), getVercelConfig(), getBankSettings()]);
  return (
    <div className="space-y-8">
      <AdminHeader title="Тохиргоо" description="Сайтын брэнд ба ерөнхий тохиргоо" />
      <LogoSettings current={logoUrl} />
      <BankSettingsForm initial={bank} />
      <VercelSettings configured={Boolean(vercel.token)} teamId={vercel.teamId} />
    </div>
  );
}
