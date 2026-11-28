/**
 * Толгой ба хөлийн ЦЭВЭР загварууд — тохиргооны мөрийг зурахад бэлэн хэлбэр
 * болгоно. JSX-ээс тусдаа байгаа нь зориуд: репод React рендерлэх тест
 * (`@testing-library/react`) байхгүй, тэгсэн ч эдгээр шийдвэрүүд нь өгөгдлийн
 * хувиргалт болохоос дүрслэл биш.
 */
import type { SettingOf } from "../lib/settings";

export type MenuItem = { href: string; label: string };

/**
 * Лого оруулаагүй үеийн анхны файлууд — artifact-ийн нөөц. Эдгээр нь
 * `public/artifact/`-д, репотой хамт явдаг тул сүлжээгүй ч гарна.
 */
export const DEFAULT_LOGO_LIGHT = "/artifact/logo.png";
export const DEFAULT_LOGO_DARK = "/artifact/logo-white.png";

export type HeaderModel = {
  align: "left" | "center";
  logoScale: number;
  tagline: string;
  menuMode: "inline" | "below" | "burger";
  items: MenuItem[];
  /** Гэрэл/бараан хоёр лого. Хоосон бол `/artifact/`-ийн анхны файл. */
  logoLight: string;
  logoDark: string;
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
  /**
   * Тохируулсан цэс БАЙВАЛ түүнийг, эс бөгөөс ангиллаар автоматаар.
   * Нуусан мөр нь гарахгүй — устгахгүйгээр түр хасах зам хэрэгтэй:
   * сонгуулийн үед нэг ангиллыг түр хаах нь ердийн хэрэг.
   */
  const custom = setting.nav.filter((n) => n.show);
  const auto = [
    { href: "/", label: "Нүүр" },
    ...categories.map((c) => ({ href: `/c/${c.slug}`, label: c.name })),
  ];

  return {
    align: setting.pos,
    logoScale: setting.size,
    tagline: setting.tagline,
    menuMode: setting.menu,
    items: custom.length > 0 ? custom.map((n) => ({ href: n.href, label: n.label })) : auto,
    logoLight: setting.logoLight || DEFAULT_LOGO_LIGHT,
    logoDark: setting.logoDark || DEFAULT_LOGO_DARK,
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
