"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { UploadCloud, Loader2 } from "lucide-react";

interface Props {
  onUploaded: (url: string, type: "video" | "image") => void;
  accept?: string;
  label?: string;
}

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function MediaUpload({
  onUploaded,
  accept = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime",
  label = "Видео эсвэл зураг оруулах",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      const type = VIDEO_TYPES.includes(file.type) ? "video" : "image";
      onUploaded(blob.url, type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload алдаа гарлаа");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] py-8 text-white/40 transition-all hover:border-v/40 hover:bg-white/[0.04] hover:text-white/60 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[12px]">Хуулж байна... {progress}%</span>
            <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-v transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <UploadCloud size={20} />
            <span className="text-[12px]">{label}</span>
            <span className="text-[10px] text-white/30">
              MP4, WEBP, PNG, JPG — 100MB хүртэл
            </span>
          </>
        )}
      </button>
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
