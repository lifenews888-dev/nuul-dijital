"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Check, AlertCircle, RotateCcw } from "lucide-react";
import { setLogoUrl, resetLogo } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LogoSettings({ current }: { current: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState(current ?? "");
  const [state, setState] = useState<"idle" | "uploading" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("uploading");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media?logo=1", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Байршуулалт амжилтгүй.");
        setState("error");
        return;
      }
      setUrl(j.asset.url);
      await setLogoUrl(j.asset.url);
      setState("idle");
      router.refresh();
    } catch {
      setError("Сүлжээний алдаа.");
      setState("error");
    }
  }

  async function saveUrl() {
    setState("saving");
    setError("");
    try {
      await setLogoUrl(url);
      setState("idle");
      router.refresh();
    } catch {
      setError("Хадгалах үед алдаа гарлаа.");
      setState("error");
    }
  }

  async function reset() {
    setState("saving");
    try {
      await resetLogo();
      setUrl("");
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  const busy = state === "uploading" || state === "saving";

  return (
    <div className="max-w-xl rounded-2xl border border-white/10 bg-card p-6">
      <h2 className="text-lg font-semibold">Сайтын лого</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Лого зураг байршуулах эсвэл URL оруулна уу. Сайт даяар (нав, footer) автоматаар солигдоно.
        Тохиромжтой: PNG/SVG, ил тод (transparent) дэвсгэртэй, өндөр нь ~40-64px.
      </p>

      {/* Current preview */}
      <div className="mt-5 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="text-xs text-muted-foreground">Одоогийн:</div>
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="logo" className="h-10 w-auto object-contain" />
        ) : (
          <span className="text-sm text-muted-foreground">Анхны вектор лого (nuul.)</span>
        )}
      </div>

      {/* Upload */}
      <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-6 text-sm font-medium text-muted-foreground hover:border-accent/40 hover:text-foreground">
        {state === "uploading" ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
        Файл байршуулах (PNG / SVG)
        <input type="file" accept="image/*,.svg" className="hidden" onChange={onFile} disabled={busy} />
      </label>

      {/* URL */}
      <div className="mt-4 flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="эсвэл лого URL оруулах" className="flex-1" />
        <Button onClick={saveUrl} disabled={busy} variant="default">
          {state === "saving" ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4" /> Хадгалах</>}
        </Button>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-error">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}

      <button onClick={reset} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <RotateCcw className="size-4" /> Анхны вектор лого руу буцаах
      </button>
    </div>
  );
}
