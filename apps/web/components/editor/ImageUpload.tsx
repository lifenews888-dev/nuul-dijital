"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Server returned HTML/empty (likely 500). Build a friendly message.
        throw new Error(
          res.status === 413
            ? "Файл хэт том байна"
            : `Серверийн алдаа (${res.status}). Vercel Blob тохиргоог шалгана уу.`
        );
      }
      if (!res.ok) throw new Error(data.error ?? `Upload алдаа (${res.status})`);
      if (!data.url) throw new Error("Серверээс зургийн URL ирсэнгүй");
      onChange(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-[12px] font-medium text-white/50">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" className="h-44 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white/80 backdrop-blur hover:bg-black/80"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-[12px] text-white/80 backdrop-blur hover:bg-black/80"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Солих
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] text-white/40 transition-all hover:border-[#7B6FFF40] hover:bg-white/[0.04] hover:text-white/60"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[12px]">Хуулж байна...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span className="text-[12px]">Зураг оруулах (JPG, PNG, WEBP — 8MB хүртэл)</span>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
