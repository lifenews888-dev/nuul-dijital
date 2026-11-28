"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { trpc, trpcMessage } from "../../../lib/trpc-client";
import { checkUpload } from "../../../lib/upload";
import { Panel, adminInput, adminButton, adminPrimary } from "./panel";

type NavRow = { label: string; href: string; show: boolean };

type HeaderValue = {
  pos: "left" | "center";
  size: number;
  tagline: string;
  menu: "inline" | "below" | "burger";
  logoLight: string;
  logoDark: string;
  nav: NavRow[];
};

const POS = [
  { value: "left", label: "Зүүнд" },
  { value: "center", label: "Голд" },
];

const MENU = [
  { value: "inline", label: "Толгойн мөрөнд" },
  { value: "below", label: "Толгойн доор" },
  { value: "burger", label: "Зөвхөн бургер цэсэнд" },
];

/**
 * Толгой, лого, цэс.
 *
 * Өмнө нь энэ самбар ЗӨВХӨН уриаг хадгалдаг байсан бөгөөд хадгалахдаа
 * бүтэн `header` объектыг бичдэг тул байрлал, хэмжээ, цэсний горим нь
 * чимээгүйгээр анхны утгадаа буцдаг байв. Одоо бүх талбар энд.
 *
 * Цэс хоосон бол «ангиллаар автоматаар» гэсэн утгатай — сайт хэзээ ч
 * цэсгүй үлдэхгүй.
 */
export function HeaderPanel({ value }: { value: HeaderValue }) {
  const router = useRouter();
  const [v, setV] = useState<HeaderValue>(value);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [slot, setSlot] = useState<"logoLight" | "logoDark" | null>(null);

  const set = (patch: Partial<HeaderValue>) => setV({ ...v, ...patch });
  const editNav = (i: number, patch: Partial<NavRow>) =>
    set({ nav: v.nav.map((n, k) => (k === i ? { ...n, ...patch } : n)) });

  async function pick(file: File | undefined) {
    if (!file || !slot) return;
    const check = checkUpload({ type: file.type, size: file.size }, "image");
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
        clientPayload: "image",
      });
      set({ [slot]: blob.url } as Partial<HeaderValue>);
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
      setSlot(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await trpc.studioAdmin.site.mutate({
        key: "header",
        value: { ...v, nav: v.nav.filter((n) => n.label.trim() && n.href.trim()) },
      });
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const LogoSlot = ({ which, label }: { which: "logoLight" | "logoDark"; label: string }) => (
    <div className="grid gap-1">
      <span className="font-head text-[12px] text-muted">{label}</span>
      <button
        type="button"
        className={`h-14 w-40 overflow-hidden rounded-md border border-line px-2 ${
          which === "logoDark" ? "bg-[#0E1426]" : "bg-[#ECE8E0]"
        }`}
        disabled={busy}
        onClick={() => {
          setSlot(which);
          fileRef.current?.click();
        }}
      >
        <img
          src={v[which] || (which === "logoDark" ? "/artifact/logo-white.png" : "/artifact/logo.png")}
          alt=""
          className="mx-auto h-full w-auto object-contain"
        />
      </button>
      {v[which] ? (
        <button
          type="button"
          className="font-head text-[12px] text-muted underline"
          onClick={() => set({ [which]: "" } as Partial<HeaderValue>)}
        >
          Анхны лого руу буцаах
        </button>
      ) : null}
    </div>
  );

  return (
    <Panel
      title="Толгой, лого ба цэс"
      hint="Сайтын бүх хуудсанд. Цэс хоосон бол ангиллаар автоматаар бүрдэнэ."
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-4">
        <LogoSlot which="logoLight" label="Цайвар дэвсгэрт" />
        <LogoSlot which="logoDark" label="Бараан дэвсгэрт" />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <label className="font-head text-[12px] text-muted">
          Уриа
          <input
            className={adminInput}
            value={v.tagline}
            maxLength={48}
            placeholder="parlamentnews.mn"
            onChange={(e) => set({ tagline: e.target.value })}
          />
        </label>

        <label className="font-head text-[12px] text-muted">
          Логоны өндөр ({v.size}px)
          <input
            type="range"
            min={20}
            max={56}
            value={v.size}
            className="w-full"
            onChange={(e) => set({ size: Number(e.target.value) })}
          />
        </label>

        <label className="font-head text-[12px] text-muted">
          Логоны байрлал
          <select
            className={adminInput}
            value={v.pos}
            onChange={(e) => set({ pos: e.target.value as HeaderValue["pos"] })}
          >
            {POS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="font-head text-[12px] text-muted">
          Цэсний байрлал
          <select
            className={adminInput}
            value={v.menu}
            onChange={(e) => set({ menu: e.target.value as HeaderValue["menu"] })}
          >
            {MENU.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-2 font-head text-[12.5px] font-semibold text-ink">Цэсний мөрүүд</div>
        <ul className="m-0 list-none p-0">
          {v.nav.map((n, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 border-t border-line py-2">
              <input
                className={`${adminInput} w-40`}
                placeholder="Нэр"
                maxLength={30}
                value={n.label}
                onChange={(e) => editNav(i, { label: e.target.value })}
              />
              <input
                className={`${adminInput} min-w-[180px] flex-1`}
                placeholder="/c/tosov"
                dir="ltr"
                value={n.href}
                onChange={(e) => editNav(i, { href: e.target.value })}
              />
              <label className="flex items-center gap-1.5 font-head text-[12.5px]">
                <input
                  type="checkbox"
                  checked={n.show}
                  onChange={(e) => editNav(i, { show: e.target.checked })}
                />
                Харуулах
              </label>
              <button
                type="button"
                className={adminButton}
                disabled={i === 0}
                onClick={() => {
                  const next = [...v.nav];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  set({ nav: next });
                }}
                aria-label="Дээш"
              >
                ↑
              </button>
              <button
                type="button"
                className={adminButton}
                onClick={() => set({ nav: v.nav.filter((_, k) => k !== i) })}
              >
                Хасах
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`${adminButton} mt-2`}
          disabled={v.nav.length >= 12}
          onClick={() => set({ nav: [...v.nav, { label: "", href: "/", show: true }] })}
        >
          ＋ Мөр нэмэх
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
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
