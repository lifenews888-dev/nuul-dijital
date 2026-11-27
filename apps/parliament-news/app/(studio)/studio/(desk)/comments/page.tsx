import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudio } from "../../../../../lib/studio-session";
import { studioComments, commentCounts } from "../../../../../lib/studio-admin";
import { Panel } from "../../../../../components/studio/admin/panel";
import { CommentsTable } from "../../../../../components/studio/admin/comments-table";

export const metadata: Metadata = { title: "Сэтгэгдэл" };

/** Сэтгэгдэл удирдах эрх — admin.html-ийн `v-cm` */
const MAY_MODERATE = ["SUPER", "CHIEF", "REVIEWER"];

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: { show?: string; q?: string };
}) {
  const { actor, tenantId } = await requireStudio();
  if (!MAY_MODERATE.includes(actor.role)) redirect("/studio");

  const show = searchParams.show;
  const hidden = show === "hidden" ? true : show === "shown" ? false : undefined;
  const q = (searchParams.q ?? "").trim();

  const [rows, counts] = await Promise.all([
    studioComments(tenantId, { hidden, q }),
    commentCounts(tenantId),
  ]);

  const chip = (key: string | undefined, label: string, n: number) => {
    const active = show === key || (key === undefined && !show);
    const href = key ? `/studio/comments?show=${key}` : "/studio/comments";
    return (
      <Link
        key={label}
        href={href}
        aria-current={active ? "page" : undefined}
        className={
          "flex h-9 items-center rounded-full border px-3.5 font-head text-[13px] font-semibold " +
          (active ? "border-cob bg-soft text-cob" : "border-line bg-pan text-muted hover:text-ink")
        }
      >
        {label} {n}
      </Link>
    );
  };

  return (
    <>
      <h1 className="mb-4 font-head text-[26px] font-bold tracking-tight md:text-[30px]">
        Уншигчдын сэтгэгдэл
      </h1>

      <form action="/studio/comments" method="get" className="mb-3 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Сэтгэгдлийн текстээр хайх"
          aria-label="Сэтгэгдэл хайх"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-inp px-3 font-head text-base text-ink md:max-w-[320px]"
        />
        <button
          type="submit"
          className="h-10 rounded-lg border border-line bg-pan px-4 font-head text-sm font-semibold text-ink"
        >
          Хайх
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {chip(undefined, "Бүгд", counts.all)}
        {chip("shown", "Харагдаж буй", counts.shown)}
        {chip("hidden", "Нуугдсан", counts.hidden)}
      </div>

      <Panel
        title="Сэтгэгдлүүд"
        hint="Нуух нь устгахаас өмнөх алхам: буруу ойлголтоор нуусныг буцааж болно, устгасныг болохгүй."
      >
        <CommentsTable rows={rows} canDelete={["SUPER", "CHIEF"].includes(actor.role)} />
      </Panel>
    </>
  );
}
