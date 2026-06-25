import { requireUser } from "@/lib/admin";
import { getLogoUrl, getVercelConfig } from "@/lib/settings";
import { AdminHeader } from "@/components/admin/ui";
import { LogoSettings } from "@/components/admin/logo-settings";
import { VercelSettings } from "@/components/admin/vercel-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireUser();
  const [logoUrl, vercel] = await Promise.all([getLogoUrl(), getVercelConfig()]);
  return (
    <div>
      <AdminHeader title="Тохиргоо" description="Сайтын брэнд ба ерөнхий тохиргоо" />
      <LogoSettings current={logoUrl} />
      <VercelSettings configured={Boolean(vercel.token)} teamId={vercel.teamId} />
    </div>
  );
}
