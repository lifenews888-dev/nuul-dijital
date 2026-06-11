"use client";

import { useRef } from "react";

/** A status <select> that submits its form (a bound server action) on change. */
export function StatusSelect({
  action,
  id,
  value,
  options,
}: {
  action: (formData: FormData) => void;
  id: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={value}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm focus:border-accent/50 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card">
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
