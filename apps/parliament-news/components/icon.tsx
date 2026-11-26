import type { ReactNode } from "react";

/**
 * Artifact-ийн `ICP` хүснэгт (index.html:723) — зөвхөн хэрэгтэй нь.
 *
 * Бүх 30 тэмдгийг нэг дор зөөхгүй байгаа нь зориуд: ашиглагдаагүй path нь
 * хуудасны багцад үлдэнэ. Шинэ тэмдэг хэрэгтэй болоход artifact-аас яг
 * тэр мөрөөр хуулж нэмнэ.
 */
const PATHS = {
  star: (
    <path
      d="M12 3.2l2.7 5.5 6 .9-4.4 4.2 1 6L12 17l-5.3 2.8 1-6-4.4-4.2 6-.9z"
      fill="currentColor"
    />
  ),
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 5.5 2.5 7 2.5 7h-17S6 15 6 9.5z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  read: (
    <path
      d="M4 5h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4zM20 5h-4a2 2 0 0 0-2 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

/** Artifact-ийн `I(name, cls)` */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ? `ic0 ${className}` : "ic0"}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
