"use client";

import { useState } from "react";
import { ICON_KEYS, getIcon } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";

/**
 * Picks a catalogue icon by key.
 *
 * The stored value is the key, so the grid doubles as the preview: whatever is
 * highlighted here is exactly what the public page will render.
 */
export function IconPickerField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [selected, setSelected] = useState(defaultValue || ICON_KEYS[0]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground/90">
        {label} <span className="text-accent">*</span>
      </span>
      <input type="hidden" name={name} value={selected} />
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        {ICON_KEYS.map((key) => {
          const Icon = getIcon(key);
          const active = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              title={key}
              aria-label={key}
              aria-pressed={active}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border transition-colors",
                active
                  ? "border-accent bg-accent text-white"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/25 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">Сонгосон: {selected}</span>
    </div>
  );
}
