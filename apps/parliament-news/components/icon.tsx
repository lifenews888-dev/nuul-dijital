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
