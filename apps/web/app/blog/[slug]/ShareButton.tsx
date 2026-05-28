"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // ignore; could fall back to a textarea + execCommand if needed
      });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/70"
    >
      {copied ? (
        <>
          <Check size={13} className="text-emerald-400" />
          Хуулсан
        </>
      ) : (
        <>
          <Link2 size={13} />
          Линк хуулах
        </>
      )}
    </button>
  );
}
