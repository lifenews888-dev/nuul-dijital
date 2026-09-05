import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { TeamForm } from "@/components/admin/forms/team-form";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ багийн гишүүн" />
      <TeamForm />
    </div>
  );
}
