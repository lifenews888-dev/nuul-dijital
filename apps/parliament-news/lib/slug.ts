import type { NewsStatus } from "@nuul/db";

/**
 * Монгол кирилл гарчгийг латин slug болгох.
 * ө→o, ү→u (ö/ü биш) — дизайн бичгийн Global Constraints.
 */
const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", ө: "o", п: "p", р: "r", с: "s",
  т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "i", э: "e", ю: "yu", я: "ya",
};

const MAX_LEN = 80;
const FALLBACK = "medee";

export function cyrillicToLatin(text: string): string {
  let out = "";
  for (const ch of text.toLowerCase()) {
    out += ch in MAP ? MAP[ch] : ch;
  }
  return out;
}

export function toSlug(title: string): string {
  let s = cyrillicToLatin(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (s.length > MAX_LEN) {
    s = s.slice(0, MAX_LEN).replace(/-+$/, "");
  }

  return s || FALLBACK;
}

/**
 * taken = ТУХАЙН TENANT-ийн эзэмшсэн бүх slug: мэдээний slug-ууд ба
 * NewsSlugRedirect.fromSlug-ууд хамтдаа. redirect-үүдийг оруулахгүй бол шинэ
 * мэдээ хуучин 301-ийн хаягийг эзэмдэж, хуваалцсан линк өөр мэдээ рүү хөтөлнө.
 */
export function uniqueSlug(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;

  let n = 2;
  while (taken.includes(base + "-" + n)) n += 1;
  return base + "-" + n;
}

/**
 * Автомат slug. Нийтэлсний дараа хаяг тогтмол байх ёстой тул
 * publishedAt байвал гарчиг засахад slug хөдлөхгүй.
 */
export function nextSlug(input: {
  title: string;
  currentSlug: string | null;
  publishedAt: Date | null;
  status?: NewsStatus;
  taken: string[];
}): string {
  const { title, currentSlug, publishedAt, status, taken } = input;

  // publishedAt БОЛОН status хоёулаа шалгагдана: publishedAt тавилгүй PUBLISHED
  // болгосон мэдээний хаяг гарчиг засахад хөдөлж, 301-гүй 404 болохоос сэргийлнэ
  if (publishedAt !== null || status === "PUBLISHED") return currentSlug ?? toSlug(title);

  const base = toSlug(title);
  if (base === currentSlug) return base;
  return uniqueSlug(base, taken);
}

/**
 * Гараар slug солих. Хуучин хаяг 301 redirect болж үлдэнэ.
 */
export function changeSlug(input: {
  currentSlug: string;
  newSlug: string;
  taken: string[];
}): { slug: string; redirectFrom: string | null } {
  const { currentSlug, newSlug, taken } = input;

  const base = toSlug(newSlug);
  const slug = base === currentSlug ? base : uniqueSlug(base, taken);

  return { slug, redirectFrom: slug === currentSlug ? null : currentSlug };
}
