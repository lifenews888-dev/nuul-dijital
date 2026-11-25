import { z } from "zod";
import { Prisma } from "@nuul/db-news";
import { tenantData } from "./tenant-db";
import type { TenantClient } from "./tenant-db";

/**
 * Tenant-ийн мөр бус тохиргоо (pn_settings дээр JSON).
 * Эх сурвалж: site-v2/admin.html-ийн saveSet() — hdr, foot, wx, rss, fxsrc/fxapi.
 * Мөр болсон тохиргоо (cats, banners, adrates, fx, ads, agenda, live, breaking,
 * att, status, ticker) нь өөрийн хүснэгтэнд — энд байхгүй.
 */

const LOGO_MIN = 20;
const LOGO_MAX = 56;

function clampSize(n: number | undefined): number {
  const v = Number.isFinite(n) ? Math.round(n as number) : 30;
  return Math.max(LOGO_MIN, Math.min(LOGO_MAX, v));
}

/** Сошиал холбоос: схемгүйг https болгож, бусад scheme-ийг хаяна */
function normalizeHttps(value: string | undefined): string {
  if (!value) return "";

  let s = value.trim();
  if (!s) return "";

  if (/^http:\/\//i.test(s)) {
    s = "https://" + s.slice("http://".length);
  } else if (!/^https:\/\//i.test(s)) {
    // javascript:, data:, mailto: гэх мэт — хориглоно
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return "";
    s = "https://" + s;
  }

  if (!/^https:\/\/[^\s"'<>]+$/.test(s)) return "";

  try {
    const url = new URL(s);
    if (url.protocol !== "https:" || !url.hostname.includes(".")) return "";
  } catch {
    return "";
  }

  return s;
}

/** Зөвхөн https-ээр бичигдсэнийг хүлээн авна (өөрөө нэмж залруулахгүй) */
function httpsOnly(value: string | undefined): string {
  if (!value) return "";
  const s = value.trim();
  return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : "";
}

const plain = z.string().max(200).default("");
const social = z.string().optional().transform(normalizeHttps);

export const headerSchema = z.object({
  pos: z.enum(["left", "center"]).default("left"),
  size: z.number().optional().transform(clampSize),
  tagline: z.string().max(48).default(""),
  menu: z.enum(["inline", "below", "burger"]).default("inline"),
});

export const footerSchema = z.object({
  addr: plain,
  phone: plain,
  email: plain,
  sales: plain,
  about: plain,
  policy: plain,
  fb: social,
  yt: social,
  ig: social,
  x: social,
});

export const weatherSchema = z.union([
  z.null(),
  z.object({
    city: z.string().trim().min(1).default("Улаанбаатар"),
    t: z.number(),
    icon: z.string().default("sun"),
    text: z.string().max(80).default(""),
  }),
]);

export const feedSchema = z.object({
  rss: z.boolean().default(true),
  fxSource: z.string().max(120).default(""),
  fxApi: z.string().optional().transform(httpsOnly),
});

export const SETTING_KEYS = ["header", "footer", "weather", "feed"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

const SCHEMAS = {
  header: headerSchema,
  footer: footerSchema,
  weather: weatherSchema,
  feed: feedSchema,
};

/** Бичлэг байхгүй үед схемд өгөх анхны оролт */
const EMPTY: Record<SettingKey, unknown> = {
  header: {},
  footer: {},
  weather: null,
  feed: {},
};

export type SettingOf<K extends SettingKey> = z.infer<(typeof SCHEMAS)[K]>;

export async function getSetting<K extends SettingKey>(
  db: TenantClient,
  key: K,
): Promise<SettingOf<K>> {
  const row = await db.tenantSetting.findFirst({ where: { key } });
  const raw = row ? row.value : EMPTY[key];
  return SCHEMAS[key].parse(raw) as SettingOf<K>;
}

export async function putSetting<K extends SettingKey>(
  db: TenantClient,
  key: K,
  value: unknown,
): Promise<void> {
  const parsed = SCHEMAS[key].parse(value);
  const json = (parsed === null ? Prisma.JsonNull : parsed) as Prisma.InputJsonValue;

  const existing = await db.tenantSetting.findFirst({ where: { key }, select: { id: true } });

  if (existing) {
    await db.tenantSetting.updateMany({ where: { key }, data: { value: json } });
    return;
  }

  await db.tenantSetting.create({ data: tenantData({ key, value: json }) });
}
