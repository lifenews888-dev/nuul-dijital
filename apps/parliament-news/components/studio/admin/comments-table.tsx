"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc, trpcMessage } from "../../../lib/trpc-client";
import { mnDateTime } from "../../../lib/format";
import type { StudioComment } from "../../../lib/studio-admin";
import { adminButton } from "./panel";

/**
 * Уншигчдын сэтгэгдэл — admin.html-ийн `v-cm`.
 *
 * Нуух нь УСТГАХААС өмнөх алхам: буруу ойлголтоор нуусныг буцааж
 * болно, устгасныг болохгүй. Иймд устгах нь зөвхөн ахлахуудад.
 */
export function CommentsTable({
  rows,
  canDelete,
}: {
  rows: StudioComment[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return <p className="font-head text-[13px] text-muted">Сэтгэгдэл алга.</p>;
  }

  return (
    <>
      <ul className="m-0 list-none p-0">
        {rows.map((c) => (
          <li
            key={c.id}
            className={
              "grid grid-cols-1 gap-2 border-t border-line py-3 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,1fr)_auto] " +
              (c.hidden ? "opacity-60" : "")
            }
          >
            <div className="min-w-0">
              <span className="flex flex-wrap items-baseline gap-2 font-head text-[12.5px] text-muted">
                <b className="font-semibold text-ink">{c.authorName}</b>
                <time dateTime={c.createdAt.toISOString()}>{mnDateTime(c.createdAt)}</time>
                <Link href={`/studio/news/${c.postId}`} className="truncate text-cob underline">
                  {c.postTitle}
                </Link>
                {c.hidden ? (
                  <span data-status="RETURNED">Нуугдсан</span>
                ) : null}
              </span>
              <p className="mt-1 whitespace-pre-line font-body text-[14px] leading-snug text-ink">
                {c.body}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-start gap-1.5">
              <button
                type="button"
                className={adminButton}
                disabled={busy === c.id}
                onClick={() =>
                  void run(c.id, () =>
                    trpc.studioAdmin.commentVisibility.mutate({ id: c.id, hidden: !c.hidden }),
                  )
                }
              >
                {c.hidden ? "Харуулах" : "Нуух"}
              </button>
              {canDelete ? (
                <button
                  type="button"
                  className={`${adminButton} hover:text-[#c0392b]`}
                  disabled={busy === c.id}
                  onClick={() =>
                    void run(c.id, () => trpc.studioAdmin.commentRemove.mutate({ id: c.id }))
                  }
                >
                  Устгах
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="mt-2 font-head text-[12.5px] font-semibold text-[#c0392b]">
          {error}
        </p>
      ) : null}
    </>
  );
}
