"use client";

import { Printer } from "lucide-react";

/** Floating action bar (hidden when printing) with a print trigger. */
export function PrintBar() {
  return (
    <div className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-2xl shadow-accent/30 transition-colors hover:bg-accent/90"
      >
        <Printer className="size-4" /> Хэвлэх / PDF болгох
      </button>
    </div>
  );
}
