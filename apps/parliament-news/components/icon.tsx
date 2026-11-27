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
  /* --- Цэсний чипүүд ба хажуугийн холбоосууд (index.html:723) --- */
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  landmark: <path d="M3 21h18M5 21V10M9.5 21V10M14.5 21V10M19 21V10M2.5 10 12 4l9.5 6z" />,
  scale: <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.6a6.5 6.5 0 0 1 3.5 5.4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-9.2-9.3A4.6 4.6 0 0 1 12 7.3a4.6 4.6 0 0 1 9.2 3.4C19.5 15.4 12 20 12 20z" />
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10.5h18M16 15h2" />
    </>
  ),
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" />,
  video: (
    <>
      <rect x="2.5" y="6" width="14" height="12" rx="2.5" />
      <path d="M16.5 10.5l5-2.5v8l-5-2.5z" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </>
  ),
  chevron: <path d="M9.5 6l6 6-6 6" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </>
  ),

  /* ---- Цаг агаар: artifact-ийн `WXI` эдгээрийг заана ---- */
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  cloudsun: (
    <>
      <path d="M8 2.5V4M3 7.5h1.5M4.6 4.1l1 1M12.4 5.1l-1 1" />
      <path d="M5.3 10.8A3.5 3.5 0 0 1 11.4 7" />
      <path d="M9 20.5a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 19 13.8a3.4 3.4 0 0 1-.6 6.7z" />
    </>
  ),
  cloud: <path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 11a3.75 3.75 0 0 1-.5 7.5z" />,
  snow: (
    <path d="M12 2.5v19M3.8 7.3l16.4 9.4M20.2 7.3 3.8 16.7M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2" />
  ),
  rain: (
    <>
      <path d="M7 15a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 7.5 3.75 3.75 0 0 1 17.5 15z" />
      <path d="M8.5 18l-1 3M12.5 18l-1 3M16.5 18l-1 3" />
    </>
  ),
  wind: <path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7" />,
  fog: <path d="M3 8h18M5 12h14M3 16h18M7 20h10" />,
  thermo: <path d="M14 14.8V4.5a2 2 0 0 0-4 0v10.3a4 4 0 1 0 4 0z" />,
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
