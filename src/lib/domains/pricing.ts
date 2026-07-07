import { db } from "@/lib/db";
import type { DomainSearchResult } from "@/lib/domains/types";
import { DEFAULT_TLDS } from "@/lib/domains/types";

export type TldPricing = {
  tld: string;
  labelMn: string;
  labelEn: string;
  registerPrice: number;
  renewPrice: number;
  transferPrice: number | null;
  minYears: number;
  maxYears: number;
  featured: boolean;
  sortOrder: number;
};

/** Fallback when DB is unavailable (matches prisma/seed.ts). */
const FALLBACK_PRICING: TldPricing[] = [
  { tld: ".mn", labelMn: "Монгол", labelEn: "Mongolia", registerPrice: 45000, renewPrice: 45000, transferPrice: null, minYears: 1, maxYears: 5, featured: true, sortOrder: 0 },
  { tld: ".com", labelMn: "Ком", labelEn: "Commercial", registerPrice: 62500, renewPrice: 62500, transferPrice: null, minYears: 1, maxYears: 5, featured: true, sortOrder: 1 },
  { tld: ".org", labelMn: "Байгууллага", labelEn: "Organization", registerPrice: 75000, renewPrice: 75000, transferPrice: null, minYears: 1, maxYears: 5, featured: false, sortOrder: 2 },
  { tld: ".net", labelMn: "Сүлжээ", labelEn: "Network", registerPrice: 94600, renewPrice: 94600, transferPrice: null, minYears: 1, maxYears: 5, featured: false, sortOrder: 3 },
  { tld: ".shop", labelMn: "Дэлгүүр", labelEn: "Shop", registerPrice: 88000, renewPrice: 88000, transferPrice: null, minYears: 1, maxYears: 5, featured: false, sortOrder: 4 },
];

export async function getActiveTldPricing(): Promise<TldPricing[]> {
  if (!process.env.DATABASE_URL) return FALLBACK_PRICING;

  try {
    const rows = await db.tldProduct.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    });

    if (rows.length === 0) return FALLBACK_PRICING;

    return rows.map((r) => ({
      tld: r.tld,
      labelMn: r.labelMn,
      labelEn: r.labelEn,
      registerPrice: r.registerPrice,
      renewPrice: r.renewPrice,
      transferPrice: r.transferPrice,
      minYears: r.minYears,
      maxYears: r.maxYears,
      featured: r.featured,
      sortOrder: r.sortOrder,
    }));
  } catch {
    return FALLBACK_PRICING;
  }
}

export async function getTldPricingMap(): Promise<Map<string, TldPricing>> {
  const list = await getActiveTldPricing();
  return new Map(list.map((p) => [p.tld, p]));
}

export function resolveTlds(requested?: string[], allowedTlds?: string[]): string[] {
  const allowed = allowedTlds?.length ? allowedTlds : [...DEFAULT_TLDS];
  const allowedSet = new Set(allowed);
  if (!requested?.length) return allowed;
  const normalized = requested
    .map((t) => (t.startsWith(".") ? t.toLowerCase() : `.${t.toLowerCase()}`))
    .filter((t) => allowedSet.has(t));
  return normalized.length > 0 ? normalized : allowed;
}

/** Domains held by in-flight or completed orders (partial-index scope). */
export async function getInternallyReservedDomains(): Promise<Set<string>> {
  if (!process.env.DATABASE_URL) return new Set();

  try {
    const orders = await db.domainOrder.findMany({
      where: {
        status: { in: ["PENDING_PAYMENT", "PAID", "FULFILLING", "COMPLETED"] },
      },
      select: { domainName: true },
    });
    return new Set(orders.map((o) => o.domainName.toLowerCase()));
  } catch {
    return new Set();
  }
}

export function toSearchResult(
  domain: string,
  tld: string,
  availability: DomainSearchResult["availability"],
  pricing: TldPricing | undefined
): DomainSearchResult {
  const purchasable = availability === "AVAILABLE";
  return {
    domain,
    tld,
    available: purchasable,
    availability,
    price: pricing?.registerPrice ?? 0,
    renewPrice: pricing?.renewPrice ?? 0,
    currency: "MNT",
    purchasable,
  };
}

export function applyReservationOverlay(
  results: DomainSearchResult[],
  reserved: Set<string>
): DomainSearchResult[] {
  return results.map((r) => {
    if (!reserved.has(r.domain.toLowerCase())) return r;
    return {
      ...r,
      available: false,
      availability: "RESERVED",
      purchasable: false,
    };
  });
}