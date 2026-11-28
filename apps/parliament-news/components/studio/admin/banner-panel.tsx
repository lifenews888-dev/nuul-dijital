"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { trpc, trpcMessage } from "../../../lib/trpc-client";
import { checkUpload } from "../../../lib/upload";
import { bannerKind } from "../../../lib/banner";
import type { SettingsData } from "../../../lib/studio-admin";
import { Panel, adminInput, adminButton, adminPrimary } from "./panel";

type Row = SettingsData["banners"][number];

const PLACEMENTS: { value: string; label: string }[] = [
  { value: "home", label: "Зөвхөн нүүр" },
  { value: "article", label: "Зөвхөн нийтлэл" },
  { value: "side", label: "Хажуу талбар" },
  { value: "both", label: "Нүүр ба хажуу (нийтлэлд үгүй)" },
  { value: "all", label: "Бүх хуудсанд" },
];

const EMPTY: Row = {
  id: "",
  imageUrl: "",
  kind: "image",
  linkUrl: null,
  title: null,
  placement: "home",
  startsOn: null,
  endsOn: null,
  paid: true,
  amount: 0,
};

/**
 * Сурталчилгааны баннер — байршуулах, хугацаа, үнэ.
 *
 * Файл нь хөтчөөс blob руу ШУУД явна; сервер нь зөвхөн токен өгөхдөө
 * эрх, төрөл, хэмжээг шалгана (`app/api/upload/route.ts`). Хадгалах
 * mutation нь мөн blob-ын хаяг эсэхийг дахин шалгана — хөтчид итгэхгүй.
 */
export function BannerPanel({ rows: initial }: { rows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<number | null>(null);

  const edit = (i: number, patch: Partial<Row>) =>
    setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  async function pick(file: File | undefined) {
    if (!file || target === null) return;
    /** Видео эсэхийг ФАЙЛЫН төрлөөр — нэрний өргөтгөл худал байж болно. */
    const kind = file.type.startsWith("video/") ? "video" : "image";
    const check = checkUpload({ type: file.type, size: file.size }, kind);
    if (!check.ok) {
      setError(check.reason);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: kind,
      });
      edit(target, { imageUrl: blob.url, kind: kind === "video" ? "video" : bannerKind(blob.url) });
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
      setTarget(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await trpc.studioAdmin.banners.mutate({
        rows: rows
          .filter((r) => r.imageUrl.trim())
          .map((r) => ({
            imageUrl: r.imageUrl.trim(),
            kind: r.kind === "video" ? ("video" as const) : ("image" as const),
            linkUrl: r.linkUrl?.trim() || undefined,
            title: r.title?.trim() || undefined,
            placement: r.placement as "home" | "article" | "side" | "both" | "all",
            startsOn: r.startsOn || undefined,
            endsOn: r.endsOn || undefined,
            paid: r.paid,
            amount: r.amount,
          })),
      });
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="Сурталчилгааны баннер"
      hint="Зураг, GIF эсвэл видео. Хугацаа оруулбал зөвхөн тэр хооронд гарна. Хоосон бол «Таны зар энд байрлана» гэсэн гэрийн зар гарна."
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      <ul className="m-0 list-none p-0">
        {rows.map((r, i) => (
          <li key={i} className="border-t border-line py-3 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-start gap-3">
              <button
                type="button"
                className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md border border-line bg-inp"
                disabled={busy}
                onClick={() => {
                  setTarget(i);
                  fileRef.current?.click();
                }}
                aria-label="Медиа сонгох"
              >
                {r.imageUrl ? (
                  r.kind === "video" ? (
                    <video src={r.imageUrl} muted className="h-full w-full object-cover" />
                  ) : (
                    <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                  )
                ) : (
                  <span className="font-head text-[12px] text-muted">＋ Файл</span>
                )}
              </button>

              <div className="grid min-w-[240px] flex-1 gap-2">
                <input
                  className={adminInput}
                  placeholder="Захиалагчийн нэр"
                  maxLength={80}
                  value={r.title ?? ""}
                  onChange={(e) => edit(i, { title: e.target.value })}
                />
                <input
                  className={adminInput}
                  placeholder="https://захиалагчийн-хаяг.mn"
                  dir="ltr"
                  value={r.linkUrl ?? ""}
                  onChange={(e) => edit(i, { linkUrl: e.target.value })}
                />
                <select
                  className={adminInput}
                  value={r.placement}
                  onChange={(e) => edit(i, { placement: e.target.value })}
                >
                  {PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid w-[190px] gap-2">
                <label className="font-head text-[12px] text-muted">
                  Эхлэх
                  <input
                    type="date"
                    className={adminInput}
                    value={r.startsOn ?? ""}
                    onChange={(e) => edit(i, { startsOn: e.target.value || null })}
                  />
                </label>
                <label className="font-head text-[12px] text-muted">
                  Дуусах
                  <input
                    type="date"
                    className={adminInput}
                    value={r.endsOn ?? ""}
                    onChange={(e) => edit(i, { endsOn: e.target.value || null })}
                  />
                </label>
                <label className="font-head text-[12px] text-muted">
                  Төлбөр (₮)
                  <input
                    type="number"
                    min={0}
                    className={adminInput}
                    value={r.amount}
                    onChange={(e) => edit(i, { amount: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="flex items-center gap-2 font-head text-[12.5px]">
                  <input
                    type="checkbox"
                    checked={r.paid}
                    onChange={(e) => edit(i, { paid: e.target.checked })}
                  />
                  Төлбөр төлсөн
                </label>
              </div>

              <button
                type="button"
                className={adminButton}
                onClick={() => setRows(rows.filter((_, k) => k !== i))}
              >
                Хасах
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={adminButton}
          disabled={rows.length >= 20}
          onClick={() => setRows([...rows, { ...EMPTY }])}
        >
          ＋ Баннер нэмэх
        </button>
        <button type="button" className={adminPrimary} disabled={busy} onClick={() => void save()}>
          {busy ? "Хадгалж байна…" : "Хадгалах"}
        </button>
        {done ? <span className="font-head text-[12.5px] text-muted">Хадгалагдлаа</span> : null}
      </div>

      {error ? (
        <p role="alert" className="mt-2 font-head text-[12.5px] font-semibold text-[#c0392b]">
          {error}
        </p>
      ) : null}
    </Panel>
  );
}
