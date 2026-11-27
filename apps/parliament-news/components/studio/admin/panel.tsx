import type { ReactNode } from "react";

/** Удирдлагын нэг самбар — admin.html-ийн `.pan` */
export function Panel({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-4 rounded-[14px] border border-line bg-pan p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h2 className="font-head text-[15px] font-bold text-ink">{title}</h2>
        {action ? <span className="ml-auto">{action}</span> : null}
      </div>
      {hint ? <p className="mb-3 font-head text-[13px] text-muted">{hint}</p> : null}
      {children}
    </section>
  );
}

export const adminInput =
  "w-full min-h-10 rounded-lg border border-line bg-inp px-2.5 font-head text-[14px] text-ink";
export const adminButton =
  "h-10 rounded-lg border border-line bg-pan px-3.5 font-head text-[13px] font-semibold text-ink hover:bg-soft disabled:opacity-50";
export const adminPrimary =
  "h-10 rounded-lg bg-cob px-4 font-head text-[13px] font-bold text-white disabled:opacity-60";
