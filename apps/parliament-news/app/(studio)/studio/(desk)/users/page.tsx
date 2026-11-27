import type { Metadata } from "next";
import { requireStudio } from "../../../../../lib/studio-session";
import { studioTeam } from "../../../../../lib/studio-admin";
import { ROLE_LABELS } from "../../../../../lib/permissions";
import { TeamTable } from "../../../../../components/studio/admin/team-table";

export const metadata: Metadata = { title: "Баг ба эрх" };

/**
 * Баг ба эрх — admin.html-ийн `v-users`.
 *
 * Жагсаалтыг гишүүн БҮР харна (хэн хэн ажиллаж байгааг мэдэх нь
 * редакцын энгийн зүйл), засах нь зөвхөн супер админд.
 */
export default async function UsersPage() {
  const { actor, tenantId } = await requireStudio();
  const members = await studioTeam(tenantId);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h1 className="font-head text-[26px] font-bold tracking-tight md:text-[30px]">
          Баг ба эрх
        </h1>
        <span className="font-head text-sm text-muted">
          {members.length} гишүүн · та {ROLE_LABELS[actor.role].name}
        </span>
      </div>

      <TeamTable
        members={members}
        canEdit={actor.role === "SUPER"}
        meId={actor.userId}
      />
    </>
  );
}
