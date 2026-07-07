import { sanitizeDomainLabel } from "@/lib/domains/sanitize";

const CYRILLIC_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  ө: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ү: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const CYRILLIC_RE = /[\u0400-\u04FF]/;

/** True when the string contains Cyrillic characters (Mongolian/Russian script). */
export function hasCyrillic(text: string): boolean {
  return CYRILLIC_RE.test(text);
}

/** Transliterate Cyrillic text to Latin; passes through non-Cyrillic characters. */
export function transliterateMn(text: string): string {
  let out = "";
  for (const ch of text) {
    const lower = ch.toLowerCase();
    const mapped = CYRILLIC_MAP[lower];
    if (mapped !== undefined) {
      out += mapped;
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Normalize free-form business text into a domain label candidate.
 * Strips TLD if pasted, transliterates Cyrillic, removes invalid chars.
 */
export function toDomainLabel(text: string): string | null {
  const transliterated = hasCyrillic(text) ? transliterateMn(text) : text;
  const collapsed = transliterated
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/\.[^.]+$/, "")
    .replace(/^-+|-+$/g, "");

  return sanitizeDomainLabel(collapsed);
}

/** Trim and collapse whitespace for cache keys. */
export function normalizeSuggestInput(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}