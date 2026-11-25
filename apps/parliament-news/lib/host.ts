/**
 * Host-ыг хэлбэржүүлж tenant-ийн төрлийг нь ялгах. Цэвэр функц —
 * middleware (Edge) ч, сервер ч ашиглана. Prisma, next/headers импортлохгүй.
 */
export type ParsedHost = {
  kind: "domain" | "subdomain" | "unknown";
  value: string | null;
};

const UNKNOWN: ParsedHost = { kind: "unknown", value: null };
const LOCAL_SUFFIX = ".localhost";

export function parseHost(host: string | null | undefined): ParsedHost {
  if (!host) return UNKNOWN;

  const h = host
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");

  if (!h) return UNKNOWN;

  // IPv4 / IPv6 — tenant домэйн болохгүй
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.startsWith("[")) return UNKNOWN;

  if (h === "localhost") return UNKNOWN;

  if (h.endsWith(LOCAL_SUFFIX)) {
    const sub = h.slice(0, -LOCAL_SUFFIX.length);
    return sub ? { kind: "subdomain", value: sub } : UNKNOWN;
  }

  // Цэггүй нэр (дотоод hostname) — домэйн гэж үзэхгүй
  if (!h.includes(".")) return UNKNOWN;

  return { kind: "domain", value: h };
}
