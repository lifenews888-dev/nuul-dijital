import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { TeamForm } from "@/components/admin/forms/team-form";

export const dynamic = "force-dynamic";

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const member = await safe(() => db.teamMember.findUnique({ where: { id } }), null);
  if (!member) notFound();
  return (
    <div>
      <AdminHeader title="Багийн гишүүн засах" />
      <TeamForm member={member} />
    </div>
  );
}
