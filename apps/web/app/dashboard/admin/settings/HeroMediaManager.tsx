/* eslint-disable @next/next/no-img-element */
"use client";

import { trpc } from "@/lib/trpc-client";
import { MediaUpload } from "@/components/editor/MediaUpload";
import { Trash2, Film, ImageIcon, GripVertical, Loader2 } from "lucide-react";

export function HeroMediaManager() {
  const utils = trpc.useUtils();
  const listQuery = trpc.heroMedia.adminList.useQuery();

  const createMutation = trpc.heroMedia.adminCreate.useMutation({
    onSuccess: () => utils.heroMedia.adminList.invalidate(),
  });
  const deleteMutation = trpc.heroMedia.adminDelete.useMutation({
    onSuccess: () => utils.heroMedia.adminList.invalidate(),
  });
  const reorderMutation = trpc.heroMedia.adminReorder.useMutation({
    onSuccess: () => utils.heroMedia.adminList.invalidate(),
  });

  const items = listQuery.data ?? [];

  function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate({ ids: next.map((i) => i.id) });
  }

  return (
    <div className="border-t border-white/[0.06] pt-5">
      <h3 className="mb-1 font-syne text-base font-semibold text-txt">
        Hero медиа (видео / зураг slider)
      </h3>
      <p className="mb-4 text-[12px] text-txt-3">
        Нэг буюу хэд хэдэн видео/зураг оруулна. Олон оруулбал автоматаар slider
        болж эргэнэ. Доорх дарааллыг сум товчоор өөрчилнө.
      </p>

      <MediaUpload
        label="Видео эсвэл зураг оруулах (slider-т нэмэгдэнэ)"
        onUploaded={(url, type) => createMutation.mutate({ url, type })}
      />

      {createMutation.isPending && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-txt-3">
          <Loader2 size={11} className="animate-spin" /> Хадгалж байна...
        </p>
      )}
      {createMutation.isError && (
        <p className="mt-2 text-[11px] text-red-400">
          {createMutation.error.message}
        </p>
      )}

      {/* Current media list */}
      <div className="mt-4 space-y-2">
        {listQuery.isLoading && (
          <p className="text-[12px] text-txt-3">Ачааллаж байна...</p>
        )}
        {!listQuery.isLoading && items.length === 0 && (
          <p className="rounded-lg border border-dashed border-white/[0.08] py-4 text-center text-[12px] text-txt-3">
            Одоогоор медиа байхгүй. Дээрх товчоор видео/зураг нэмнэ үү. (Хоосон
            бол hero дээр анимацилсан gradient харагдана.)
          </p>
        )}
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-bg-3 p-2.5"
          >
            <div className="flex flex-col">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0 || reorderMutation.isPending}
                className="text-txt-3 hover:text-white disabled:opacity-20"
                aria-label="Дээш"
              >
                ▲
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1 || reorderMutation.isPending}
                className="text-txt-3 hover:text-white disabled:opacity-20"
                aria-label="Доош"
              >
                ▼
              </button>
            </div>

            {/* Preview */}
            <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-md bg-black">
              {item.type === "video" ? (
                <video src={item.url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/60">
                {item.type === "video" ? <Film size={10} /> : <ImageIcon size={10} />}
                {item.type === "video" ? "Видео" : "Зураг"}
              </span>
              <span className="truncate text-[11px] text-txt-3">{item.url.split("/").pop()}</span>
            </div>

            <button
              onClick={() => {
                if (confirm("Энэ медиаг устгах уу?")) {
                  deleteMutation.mutate({ id: item.id });
                }
              }}
              className="rounded-md p-1.5 text-txt-3 hover:bg-red-500/10 hover:text-red-400"
              aria-label="Устгах"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
