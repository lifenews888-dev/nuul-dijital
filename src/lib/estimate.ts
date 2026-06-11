/**
 * Auto project-cost estimator.
 *
 * Produces an approximate price range (₮) from a submitted brief. This is an
 * internal, admin-facing starting point — the admin reviews, adjusts, and sets
 * the final quote before anything reaches the customer.
 *
 * All figures in Mongolian Tugrik (₮).
 */

export type EstimateItem = { label: string; min: number; max: number };
export type Estimate = { min: number; max: number; items: EstimateItem[] };

type BriefLike = {
  services?: string[];
  pages?: string[];
  features?: string[];
  needsAuth?: boolean | null;
  hasLogo?: boolean | null;
  projectTypes?: string[];
};

const SERVICE_BASE: Record<string, [number, number]> = {
  "Вэб хөгжүүлэлт": [3_000_000, 8_000_000],
  "AI чатбот": [4_000_000, 12_000_000],
  "Бизнес автоматжуулалт": [5_000_000, 15_000_000],
  "E-commerce систем": [6_000_000, 18_000_000],
  "Мобайл аппликейшн": [10_000_000, 30_000_000],
  "UI/UX дизайн": [2_000_000, 6_000_000],
  "Брэндинг": [2_000_000, 5_000_000],
  "Cloud дэд бүтэц": [3_000_000, 10_000_000],
  "Дижитал маркетинг": [2_000_000, 6_000_000],
};

// Features that meaningfully increase scope.
const HEAVY_FEATURES = new Set([
  "Онлайн төлбөр (QPay)",
  "Захиалгын систем",
  "Хэрэглэгчийн бүртгэл / нэвтрэлт",
  "Олон хэл",
]);

const PAGES_INCLUDED = 5;

export function estimateBrief(b: BriefLike): Estimate {
  const items: EstimateItem[] = [];
  const add = (label: string, min: number, max: number) => items.push({ label, min, max });

  // Services
  const services = b.services ?? [];
  if (services.length === 0) {
    add("Суурь вэб шийдэл", 3_000_000, 8_000_000);
  } else {
    for (const s of services) {
      const [min, max] = SERVICE_BASE[s] ?? [2_000_000, 5_000_000];
      add(s, min, max);
    }
  }

  // Extra pages beyond the included baseline
  const extraPages = Math.max(0, (b.pages?.length ?? 0) - PAGES_INCLUDED);
  if (extraPages > 0) add(`Нэмэлт хуудас × ${extraPages}`, extraPages * 300_000, extraPages * 600_000);

  // Features
  for (const f of b.features ?? []) {
    if (HEAVY_FEATURES.has(f)) add(f, 1_000_000, 3_000_000);
    else add(f, 500_000, 1_500_000);
  }

  // Auth (if not already chosen as a feature)
  const authFeature = (b.features ?? []).includes("Хэрэглэгчийн бүртгэл / нэвтрэлт");
  if (b.needsAuth === true && !authFeature) add("Бүртгэл / нэвтрэх систем", 1_000_000, 2_500_000);

  // Branding if no logo
  if (b.hasLogo === false) add("Лого ба брэндинг", 1_500_000, 3_000_000);

  const min = items.reduce((s, i) => s + i.min, 0);
  const max = items.reduce((s, i) => s + i.max, 0);
  return { min, max, items };
}

/** ₮ formatter: 12000000 → "12,000,000₮" */
export function formatMnt(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(n)) + "₮";
}
