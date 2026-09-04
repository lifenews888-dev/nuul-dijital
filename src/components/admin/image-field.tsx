"use client";

import { useRef, useState } from "react";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Vercel caps a serverless request body at roughly 4.5MB, so reject oversized
 * files in the browser where we can still explain why.
 */
const MAX_BYTES = 4 * 1024 * 1024;

export function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** Uploads one file to the media library and returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error(`Файл хэт том (${formatBytes(file.size)}). ${formatBytes(MAX_BYTES)}-аас бага байх ёстой.`);
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.asset?.url) {
    throw new Error(json?.error ?? "Байршуулалт амжилтгүй.");
  }
  return json.asset.url as string;
}

/**
 * Image field for the admin forms: paste a URL or upload a file.
 *
 * Uploading stores the file in our own media library and fills the input with
 * that URL — pasted links from social networks are signed and expire, which is
 * how the team photo went dead.
 */
export function ImageField({
  name,
  label,
  defaultValue = "",
  required,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again after an error
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setUrl(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Байршуулалт амжилтгүй.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground/90">
        {label} {required && <span className="text-accent">*</span>}
      </span>

      <div className="flex gap-3">
        {url ? (
          <span className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {/* Raw <img>: an admin preview should show a broken link as broken,
                not route a dead URL through the image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => setUrl("")}
              aria-label="Зургийг арилгах"
              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-md bg-black/70 text-white transition-colors hover:bg-black"
            >
              <X className="size-3" />
            </button>
          </span>
        ) : (
          <span className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/15 text-muted-foreground">
            <ImagePlus className="size-5" />
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required={required}
            placeholder="https://… эсвэл баруун талаас байршуулна уу"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:border-white/25 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              {busy ? "Байршуулж байна…" : "Зураг байршуулах"}
            </button>
            {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
        disabled={busy}
      />

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-error">
          <AlertCircle className="size-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
