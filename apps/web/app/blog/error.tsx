"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for client-side visibility
    console.error("[blog error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#030310] px-6 py-32 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-8">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-red-400">
          Алдаа гарлаа
        </div>
        <h1 className="mb-4 font-syne text-2xl font-semibold">
          Блог хуудсыг ачаалж чадсангүй
        </h1>

        <div className="mb-6 space-y-2 rounded-lg bg-black/40 p-4 font-mono text-[12px] text-red-300">
          <div>
            <span className="text-white/40">Message:</span>{" "}
            {error.message || "Тодорхойгүй алдаа"}
          </div>
          {error.digest && (
            <div>
              <span className="text-white/40">Digest:</span> {error.digest}
            </div>
          )}
          {error.name && error.name !== "Error" && (
            <div>
              <span className="text-white/40">Name:</span> {error.name}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-white px-5 py-2 text-[13px] font-semibold text-black hover:bg-gray-100"
          >
            Дахин оролдох
          </button>
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-5 py-2 text-[13px] font-medium text-white/80 hover:bg-white/5"
          >
            Нүүр рүү буцах
          </Link>
        </div>
      </div>
    </div>
  );
}
