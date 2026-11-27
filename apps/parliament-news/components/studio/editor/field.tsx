"use client";

import type { ReactNode } from "react";

/**
 * Формын нэг талбар — admin.html-ийн `.fl`.
 *
 * Тоолуур нь `maxlength`-ийн хажуугаар байх ЁСТОЙ: хөтөч нь хязгаарт
 * хүрэхэд үсгийг чимээгүй залгихаа больдог, редактор юу болсныг
 * ойлгохгүй. Тоо нь ойртоход анхааруулна.
 */
export function Field({
  label,
  hint,
  value,
  max,
  children,
}: {
  label: string;
  hint?: string;
  value?: string;
  max?: number;
  children: ReactNode;
}) {
  const used = value?.length ?? 0;
  const near = max !== undefined && used > max * 0.9;

  return (
    <label className="mb-3 block">
      <span className="mb-1.5 flex items-baseline gap-2 font-head text-[13px] font-semibold text-muted">
        {label}
        {hint ? <em className="font-normal not-italic text-muted/80">{hint}</em> : null}
        {max !== undefined ? (
          <em
            className={
              "ml-auto font-normal not-italic tabular-nums " +
              (near ? "font-semibold text-[#c0392b]" : "text-muted/80")
            }
          >
            {`${used}/${max}`}
          </em>
        ) : null}
      </span>
      {children}
    </label>
  );
}

/** Нэг хэсгийн хүрээ — admin.html-ийн `.fs` */
export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-[14px] border border-line bg-pan p-4 md:p-5">
      <h3 className="mb-3.5 font-head text-[15px] font-bold text-ink">
        {title}
        {hint ? <small className="ml-2 font-medium text-muted">{hint}</small> : null}
      </h3>
      {children}
    </section>
  );
}

export const inputClass =
  "w-full min-h-11 rounded-lg border border-line bg-inp px-3 py-2 font-head text-base text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";
