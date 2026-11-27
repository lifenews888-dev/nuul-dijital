"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trpc, trpcMessage } from "../../lib/trpc-client";

/**
 * Мэдээ устгах — admin.html-ийн `del()` (:1054).
 *
 * Хоёр алхамтай: нэг дарлатаар устгахгүй. Artifact нь «Мэдээг устгах уу?
 * «гарчиг» бүрмөсөн устна. Буцаах боломжгүй.» гэж асуудаг — энд мөн
 * гарчгийг нэрлэнэ, эс бөгөөс редактор хоёр ижил мөрийн алийг нь
 * устгаж байгаагаа мэдэхгүй.
 *
 * Эрх нь СЕРВЕРТ шалгагдана (`canDelete`) — энэ товч харагдах эсэх нь
 * зөвхөн дарж болохгүй товч үзүүлэхгүйн тул.
 */
export function DeleteButton({ postId, title }: { postId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await trpc.studioNews.remove.mutate({ id: postId });
      setAsking(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(trpcMessage(e));
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="h-9 shrink-0 rounded-lg border border-line bg-pan px-3 font-head text-[13px] font-semibold text-muted hover:text-[#c0392b]"
      >
        Устгах
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="max-w-[260px] text-right font-head text-[12.5px] text-muted">
        «{title || "(гарчиггүй)"}» бүрмөсөн устна. Буцаах боломжгүй.
      </p>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy || pending}
          className="h-9 rounded-lg bg-[#c0392b] px-3 font-head text-[13px] font-bold text-white disabled:opacity-60"
        >
          {busy ? "Устгаж байна…" : "Устгах"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAsking(false);
            setError(null);
          }}
          className="h-9 rounded-lg border border-line bg-pan px-3 font-head text-[13px] font-semibold text-muted"
        >
          Болих
        </button>
      </div>
      {error ? (
        <p role="alert" className="font-head text-[12.5px] font-semibold text-[#c0392b]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
