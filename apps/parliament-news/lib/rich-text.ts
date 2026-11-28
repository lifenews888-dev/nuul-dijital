import { safeImageSrc } from "./images";

/**
 * Хадгалсан мэдээний биетийг БҮТЭЦЛЭГДСЭН блок болгоно.
 *
 * Artifact-ийн `richBody()` ба `inl()`-ийн дүрэм, ГЭХДЭЭ HTML БИШ.
 * Artifact нь мөр үүсгээд `innerHTML`-д тавьдаг; бид React элемент болгох
 * блокуудыг буцаана. Ялгаа нь аюулгүй байдлын суурь: HTML огт үүсгэхгүй
 * тул `<script>`, `onerror=`, `javascript:` зэрэг нь ажиллах ЗАМГҮЙ —
 * sanitize хийх эсэх нь санал биш, боломжгүй зүйл болно.
 *
 * Тэмдэглэгээ (бүгд artifact-ынх, `>>` нь нэмэлт):
 *   `## Гарчиг`            → h3
 *   `> ишлэл`              → quote
 *   `>> онцлох ишлэл`      → pull   (НЭМЭЛТ: онцлох санааг томоор)
 *   `- мөр`                → list
 *   `[[img:URL|тайлбар]]`  → img
 *   `[[embed:URL]]`        → embed  (НЭМЭЛТ: сошиал шигтгээ)
 *   `**тод**  *налуу*  [текст](https://…)`
 */

export type Span = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
};

export type Block =
  | { kind: "p" | "h3" | "quote" | "pull"; spans: Span[] }
  | { kind: "img"; url: string; caption: string | null }
  | { kind: "embed"; url: string }
  | { kind: "list"; items: Span[][] };

/**
 * Холбоос нь ЗӨВХӨН https. Artifact ч ялгаагүй: `http://` нь завсрын
 * халдлагад нээлттэй, `javascript:` нь гүйцэтгэгдэх код. Тохирохгүй бол
 * мөр нь бүтнээрээ ТЕКСТ болж үлдэнэ — уншигч юу бичсэнийг харна.
 */
const INLINE =
  /\[([^\]]{1,120})\]\((https:\/\/[^\s)"'<>]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;

const IMG = /^\[\[img:(\S+?)(?:\|([^\]]*))?\]\]$/;
const EMBED = /^\[\[embed:(\S+?)\]\]$/;

/** Нэг догол мөрийн текстийг span болгоно. */
export function parseSpans(line: string): Span[] {
  const out: Span[] = [];
  let at = 0;

  for (const m of line.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > at) out.push({ text: line.slice(at, start) });

    if (m[2]) out.push({ text: m[1], href: m[2] });
    else if (m[3]) out.push({ text: m[3], bold: true });
    else if (m[4]) out.push({ text: m[4], italic: true });

    at = start + m[0].length;
  }
  if (at < line.length) out.push({ text: line.slice(at) });

  return out.length > 0 ? out : [{ text: line }];
}

function listOf(lines: string[]): Block | null {
  if (!lines.every((l) => /^-\s+/.test(l))) return null;
  return { kind: "list", items: lines.map((l) => parseSpans(l.replace(/^-\s+/, ""))) };
}

export function parseRich(body: string | null): Block[] {
  if (!body) return [];

  const blocks: Block[] = [];

  for (const raw of body.replace(/\r/g, "").split(/\n{2,}/)) {
    const chunk = raw.trim();
    if (!chunk) continue;

    const img = IMG.exec(chunk);
    if (img) {
      /** Зөвшөөрөгдөөгүй хост нь блок үүсгэхгүй: хоосон нүх үлдээхээс дээр. */
      const url = safeImageSrc(img[1]);
      if (url) blocks.push({ kind: "img", url, caption: img[2] ?? null });
      continue;
    }

    const embed = EMBED.exec(chunk);
    if (embed) {
      if (/^https:\/\//.test(embed[1])) blocks.push({ kind: "embed", url: embed[1] });
      continue;
    }

    if (/^##\s+/.test(chunk)) {
      blocks.push({ kind: "h3", spans: parseSpans(chunk.replace(/^##\s+/, "")) });
      continue;
    }
    if (/^>>\s*/.test(chunk)) {
      blocks.push({ kind: "pull", spans: parseSpans(chunk.replace(/^>>\s*/, "")) });
      continue;
    }
    if (/^>\s*/.test(chunk)) {
      blocks.push({ kind: "quote", spans: parseSpans(chunk.replace(/^>\s*/, "")) });
      continue;
    }

    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const list = listOf(lines);
    if (list) {
      blocks.push(list);
      continue;
    }

    /**
     * Догол мөрийн доторх мөр таслалт нь ХАДГАЛАГДАНА (`\n` нь span-д үлдэнэ)
     * — `.dbody` нь `white-space:pre-line` тул дүрслэгч нь өөрөө таслана.
     */
    blocks.push({ kind: "p", spans: parseSpans(chunk) });
  }

  return blocks;
}
