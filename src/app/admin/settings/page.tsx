import { requireUser } from "@/lib/admin";
import { getLogoUrl } from "@/lib/settings";
import { AdminHeader } from "@/components/admin/ui";
import { LogoSettings } from "@/components/admin/logo-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireUser();
  const logoUrl = await getLogoUrl();
  return (
    <div>
      <AdminHeader title="Тохиргоо" description="Сайтын брэнд ба ерөнхий тохиргоо" />
      <LogoSettings current={logoUrl} />
    </div>
  );
}
