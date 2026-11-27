"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trpc, trpcMessage } from "../../lib/trpc-client";
import type { AvailableAction } from "../../lib/workflow-actions";
import type { WorkflowAction } from "../../lib/permissions";

const TONE: Record<AvailableAction["tone"], string> = {
  primary: "bg-cob text-white",
  publish: "bg-red text-white",
  danger: "border border-[#c0392b] bg-pan text-[#c0392b]",
  secondary: "border border-line bg-pan text-muted",
};

/**
 * Урсгалын товчнууд — мөр дээр шууд.
 *
 * Мэдээ засварлагч (3b) нь эдгээрийг өөрийн `.actbar`-т авна. Тэр
 * хүртэл урсгал нь UI-аас ХҮРЭХ БОЛОМЖТОЙ байх ёстой: эс бөгөөс
 * сэтгүүлч мэдээг хянуулахаар илгээх арга байхгүй болно.
 *
 * Товч нуух нь хамгаалалт биш — `studioNews.act` нь мөн `canAct`-ийг
 * дуудна. Энд нуух нь зөвхөн дарж болохгүй товчийг үзүүлэхгүй байхын тул.
 */
export function WorkflowButtons({
  postId,
  actions,
}: {
  postId: string;
  actions: AvailableAction[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<WorkflowAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<WorkflowAction | null>(null);
  const [note, setNote] = useState("");

  if (actions.length === 0) return null;

  async function run(action: WorkflowAction, withNote?: string) {
    setBusy(action);
    setError(null);
    try {
      await trpc.studioNews.act.mutate({ id: postId, action, note: withNote });
      setNoteFor(null);
      setNote("");
      /** Серверийн компонентыг дахин татна — шинэ төлөв, шинэ товчнууд */
      startTransition(() => router.refresh());
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const working = busy !== null || pending;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        {actions.map((a) => (
          <button
            key={a.action}
            type="button"
            disabled={working}
            onClick={() => (a.needsNote ? setNoteFor(a.action) : run(a.action))}
            className={
              "h-9 whitespace-nowrap rounded-lg px-3 font-head text-[13px] font-bold disabled:opacity-60 " +
              TONE[a.tone]
            }
          >
            <span className="hidden md:inline">{a.label}</span>
            <span className="md:hidden">{a.short}</span>
          </button>
        ))}
      </div>

      {noteFor ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(noteFor, note);
          }}
          className="flex w-full min-w-[220px] flex-col gap-1.5 md:w-[280px]"
        >
          <label className="font-head text-[12px] font-semibold text-muted">
            Яагаад буцааж байна вэ — сэтгүүлч юу засахаа мэдэх ёстой
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={3}
              maxLength={1000}
              className="mt-1 w-full rounded-lg border border-line bg-inp p-2 font-head text-[13px] font-normal text-ink"
            />
          </label>
          <div className="flex gap-1.5">
            <button
              type="submit"
              disabled={working}
              className="h-9 rounded-lg bg-cob px-3 font-head text-[13px] font-bold text-white disabled:opacity-60"
            >
              Буцаах
            </button>
            <button
              type="button"
              onClick={() => {
                setNoteFor(null);
                setNote("");
              }}
              className="h-9 rounded-lg border border-line bg-pan px-3 font-head text-[13px] font-semibold text-muted"
            >
              Болих
            </button>
          </div>
        </form>
      ) : null}

      {/* Алдаа нь дэлгэц уншигчид ч хүрнэ */}
      {error ? (
        <p role="alert" className="font-head text-[12.5px] font-semibold text-[#c0392b]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
