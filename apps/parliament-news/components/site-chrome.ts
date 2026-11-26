/**
 * Толгой ба хөлийн ЦЭВЭР загварууд — тохиргооны мөрийг зурахад бэлэн хэлбэр
 * болгоно. JSX-ээс тусдаа байгаа нь зориуд: репод React рендерлэх тест
 * (`@testing-library/react`) байхгүй, тэгсэн ч эдгээр шийдвэрүүд нь өгөгдлийн
 * хувиргалт болохоос дүрслэл биш.
 */
import type { SettingOf } from "../lib/settings";

export type MenuItem = { href: string; label: string };

export type HeaderModel = {
  align: "left" | "center";
  logoScale: number;
  tagline: string;
  menuMode: "inline" | "below" | "burger";
  items: MenuItem[];
};

export type FooterModel = {
  contact: { label: string; value: string }[];
  /**
   * `about` (1500 тэмдэгт) ба `policy` (2000) нь artifact-д textarea —
   * урт текст, холбоос БИШ. Тиймээс хөлд текстийн блок болж гарна.
   */
  texts: { label: string; body: string }[];
  socials: { kind: "fb" | "yt" | "ig" | "x"; href: string }[];
};

const CONTACT_LABELS: ReadonlyArray<[keyof SettingOf<"footer">, string]> = [
  ["addr", "Хаяг"],
  ["phone", "Утас"],
  ["email", "И-мэйл"],
  ["sales", "Сурталчилгаа"],
];

const TEXT_LABELS: ReadonlyArray<[keyof SettingOf<"footer">, string]> = [
  ["about", "Бидний тухай"],
  ["policy", "Нууцлалын бодлого"],
];

const SOCIAL_KINDS = ["fb", "yt", "ig", "x"] as const;

export function headerModel(
  setting: SettingOf<"header">,
  categories: { slug: string; name: string }[],
): HeaderModel {
  return {
    align: setting.pos,
    logoScale: setting.size,
    tagline: setting.tagline,
    menuMode: setting.menu,
    items: [
      { href: "/", label: "Нүүр" },
      ...categories.map((c) => ({ href: `/c/${c.slug}`, label: c.name })),
    ],
  };
}

export function footerModel(setting: SettingOf<"footer">): FooterModel {
  const pick = (entries: ReadonlyArray<[keyof SettingOf<"footer">, string]>) =>
    entries
      .map(([key, label]) => ({ label, value: String(setting[key] ?? "").trim() }))
      .filter((row) => row.value !== "");

  return {
    contact: pick(CONTACT_LABELS),
    texts: pick(TEXT_LABELS).map(({ label, value }) => ({ label, body: value })),
    socials: SOCIAL_KINDS.filter((k) => setting[k]).map((kind) => ({
      kind,
      href: setting[kind],
    })),
  };
}
