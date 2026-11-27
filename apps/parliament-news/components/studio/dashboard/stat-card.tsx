import Link from "next/link";

/**
 * Тоон карт — admin.html-ийн самбарын дээд эгнээ.
 *
 * Карт бүр ХАА НЭГТЭЭ хөтөлнө: тоо нь өөрөө хариулт биш, «44 ноорог»
 * гэдгийг хараад дараагийн алхам нь тэднийг нээх явдал.
 */
export function StatCard({
  label,
  value,
  note,
  href,
  accent,
}: {
  label: string;
  value: number;
  note?: string;
  href?: string;
  accent?: "cob" | "ok" | "warn" | "red";
}) {
  const bar =
    accent === "ok"
      ? "bg-ok"
      : accent === "warn"
        ? "bg-warn"
        : accent === "red"
          ? "bg-red"
          : "bg-cob";

  const body = (
    <>
      <span className="block font-head text-[12.5px] font-semibold text-muted">{label}</span>
      <b className="mt-1 block font-head text-[34px] font-bold leading-none tabular-nums text-ink">
        {value}
      </b>
      {note ? (
        <span className="mt-1.5 block font-head text-[12px] text-muted">{note}</span>
      ) : null}
      <span className={`mt-3 block h-[3px] w-10 rounded-full ${bar}`} />
    </>
  );

  const className =
    "block rounded-[14px] border border-line bg-pan px-4 py-3.5 " +
    (href ? "hover:border-cob" : "");

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
