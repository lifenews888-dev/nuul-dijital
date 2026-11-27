"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NewsRole } from "@nuul/db-news";
import { ROLE_LABELS, SECTIONS } from "../../../lib/permissions";
import { trpc, trpcMessage } from "../../../lib/trpc-client";
import type { TeamMember } from "../../../lib/studio-admin";
import { Panel, adminInput, adminButton } from "./panel";

const ROLES = Object.keys(ROLE_LABELS) as NewsRole[];

/**
 * Баг ба эрх — admin.html-ийн `v-users`.
 *
 * Зөвхөн СУПЕР АДМИН өөрчилнө. Хүн нэмэх нь энд БИШ: нууц үг нь
 * терминалаар үүсдэг (`pnpm db:seed:member`) бөгөөд вэб формоор
 * үүсгэвэл нууц үг сүлжээгээр, лог-оор дамжина.
 */
export function TeamTable({
  members,
  canEdit,
  meId,
}: {
  members: TeamMember[];
  canEdit: boolean;
  meId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function change(userId: string, role: NewsRole, active: boolean) {
    setBusy(userId);
    setError(null);
    try {
      await trpc.studioAdmin.memberRole.mutate({ userId, role, active });
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Panel
        title="Эрх олгосон ажилтнууд"
        hint={
          canEdit
            ? "Үүрэг солиход хүний нууц үг хөдлөхгүй. Хаасан гишүүн нэвтэрч чадах ч студид орохгүй."
            : "Эрхийн тохиргоог зөвхөн супер админ хийнэ."
        }
      >
        {members.length === 0 ? (
          <p className="font-head text-[13px] text-muted">Гишүүн алга.</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {members.map((m) => (
              <li
                key={m.userId}
                className="grid grid-cols-1 items-center gap-2 border-t border-line py-2.5 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,1fr)_200px_auto]"
              >
                <div className="min-w-0">
                  <b className="block font-head text-[14px] font-semibold text-ink">
                    {m.name ?? "(нэргүй)"}
                    {m.userId === meId ? (
                      <span className="ml-2 font-normal text-muted">— та</span>
                    ) : null}
                  </b>
                  <span className="block truncate font-head text-[12.5px] text-muted" dir="ltr">
                    {m.email} · {m.actions} үйлдэл (30 хоног)
                  </span>
                </div>

                {canEdit ? (
                  <select
                    className={adminInput}
                    value={m.role}
                    disabled={busy === m.userId}
                    onChange={(e) => void change(m.userId, e.target.value as NewsRole, m.active)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r].name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-head text-[13px] text-muted">
                    {ROLE_LABELS[m.role].name}
                  </span>
                )}

                {canEdit ? (
                  <button
                    type="button"
                    className={adminButton}
                    disabled={busy === m.userId}
                    onClick={() => void change(m.userId, m.role, !m.active)}
                  >
                    {m.active ? "Хаах" : "Нээх"}
                  </button>
                ) : (
                  <span className="font-head text-[13px] text-muted">
                    {m.active ? "Идэвхтэй" : "Хаасан"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {error ? (
          <p role="alert" className="mt-2 font-head text-[12.5px] font-semibold text-[#c0392b]">
            {error}
          </p>
        ) : null}
      </Panel>

      {/*
        Ажилтан нэмэх заавар нь ЗӨВХӨН засах эрхтэйд. Команд нь нууц
        биш ч, хийж чадахгүй зүйлийн заавар харуулах нь төөрөгдүүлнэ.
      */}
      {canEdit ? (
      <Panel
        title="Ажилтан нэмэх"
        hint="Нууц үг нь ТЕРМИНАЛД нэг удаа хэвлэгдэнэ. Вэб формоор үүсгэвэл нууц үг сүлжээгээр, серверийн лог-оор дамжина — тиймээс энд форм БАЙХГҮЙ."
      >
        <pre className="overflow-x-auto rounded-lg border border-line bg-inp p-3 font-mono text-[12.5px] text-ink">
{`cd packages/db-news
MEMBER_EMAIL=нэр@parlamentnews.mn MEMBER_NAME="Б. Болд" MEMBER_ROLE=REPORTER pnpm db:seed:member`}
        </pre>
        <p className="mt-2 font-head text-[12.5px] text-muted">
          Байгаа хүн дээр дахин ажиллуулбал нууц үг дарагдахгүй — зөвхөн үүрэг, нэр шинэчлэгдэнэ.
        </p>
      </Panel>
      ) : null}

      <Panel title="Эрхийн төрлүүд" hint="Үүрэг бүр юу засаж чадахыг доорх хүснэгт харуулна.">
        <ul className="m-0 list-none p-0">
          {ROLES.map((r) => (
            <li key={r} className="border-t border-line py-2 first:border-t-0 first:pt-0">
              <b className="font-head text-[13.5px] font-semibold text-ink">
                {ROLE_LABELS[r].name}
              </b>
              <span className="ml-2 font-head text-[12px] text-muted">
                {SECTIONS[r].length === 0 ? "засварлахгүй" : SECTIONS[r].join(" · ")}
              </span>
              <p className="mt-0.5 font-head text-[12.5px] text-muted">{ROLE_LABELS[r].about}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
