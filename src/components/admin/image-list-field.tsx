"use client";

import { useRef, useState } from "react";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "@/components/admin/image-field";

/**
 * Gallery field: a list of image URLs, one per line, with multi-file upload.
 *
 * The value stays a newline-separated string in a hidden input so the server
 * action keeps parsing it exactly as it did when this was a plain textarea.
 */
export function ImageListField({
  name,
  label,
  defaultValue = "",
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
}) {
  const [urls, setUrls] = useState<string[]>(
    defaultValue.split("\n").map((s) => s.trim()).filter(Boolean)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError("");
    const added: string[] = [];
    const failed: string[] = [];
    for (const file of files) {
      try {
        added.push(await uploadImage(file));
      } catch (err) {
        failed.push(`${file.name}: ${err instanceof Error ? err.message : "алдаа"}`);
      }
    }
    if (added.length) setUrls((prev) => [...prev, ...added]);
    if (failed.length) setError(failed.join(" · "));
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground/90">{label}</span>
      <input type="hidden" name={name} value={urls.join("\n")} />

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <span
              key={`${url}-${i}`}
              className="relative size-20 overflow-hidden rounded-xl border border-white/10 bg-white/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Зургийг хасах"
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-md bg-black/70 text-white transition-colors hover:bg-black"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:border-white/25 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
          {busy ? "Байршуулж байна…" : "Зураг нэмэх"}
        </button>
        {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
        disabled={busy}
      />

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-error">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
