import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStudio } from "../../../../../lib/studio-session";
import { settingsData } from "../../../../../lib/studio-admin";
import { canEditSettings, ROLE_LABELS } from "../../../../../lib/permissions";
import { SettingsForm } from "../../../../../components/studio/admin/settings-form";
import { Panel } from "../../../../../components/studio/admin/panel";

export const metadata: Metadata = { title: "Сайтын тохиргоо" };

/**
 * Сайтын тохиргоо — admin.html-ийн `v-set`.
 *
 * `canEditSettings`: супер админ, ерөнхий редактор, шууд дамжуулалтын
 * оператор. Сүүлчийнх нь ажил БҮХЭЛДЭЭ энд байна.
 */
export default async function SettingsPage() {
  const { actor, tenantId } = await requireStudio();
  if (!canEditSettings(actor)) redirect("/studio");

  const data = await settingsData(tenantId);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h1 className="font-head text-[26px] font-bold tracking-tight md:text-[30px]">
          Сайтын тохиргоо
        </h1>
        <span className="font-head text-sm text-muted">{ROLE_LABELS[actor.role].name}</span>
      </div>

      <SettingsForm data={data} />

      <Panel title="Таны эрх">
        <p className="font-head text-[13px] text-muted">
          Та <b className="text-ink">{ROLE_LABELS[actor.role].name}</b> —{" "}
          {ROLE_LABELS[actor.role].about}. Эрхийн тохиргоог «Баг ба эрх» хэсгээс супер админ
          хийнэ.
        </p>
      </Panel>
    </>
  );
}
