"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Check, AlertCircle } from "lucide-react";

/**
 * Uploads a file to /api/admin/media (which stores it via Vercel Blob and
 * creates a MediaAsset row), then refreshes the grid.
 */
export function MediaUploader() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("loading");
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (res.ok) {
        setState("done");
        router.refresh();
        setTimeout(() => setState("idle"), 1500);
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Байршуулалт амжилтгүй.");
        setState("error");
      }
    } catch {
      setError("Сүлжээний алдаа.");
      setState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-card p-5">
      <label className="flex cursor-pointer flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          {state === "loading" ? (
            <Loader2 className="size-6 animate-spin" />
          ) : state === "done" ? (
            <Check className="size-6" />
          ) : (
            <Upload className="size-6" />
          )}
        </div>
        <div>
          <div className="font-semibold">Файл байршуулах</div>
          <div className="text-xs text-muted-foreground">Зураг, видео, эсвэл PDF</div>
        </div>
        <input
          type="file"
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={onChange}
          disabled={state === "loading"}
        />
      </label>
      {state === "error" && (
        <p className="flex items-center justify-center gap-2 text-xs text-error">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}
    </div>
  );
}
