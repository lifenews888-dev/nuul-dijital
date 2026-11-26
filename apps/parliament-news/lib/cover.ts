/**
 * Номын хавтасны SVG — `site-v2/admin.html:813-842`-ийн `cover()`-ийн порт.
 *
 * Цэвэр функцууд, DOM шаардахгүй: тул ЭНЭ НЭГ модуль нь 3D тавиур, нийтлэлийн
 * хуудас, Open Graph зураг гурвуулангийн дүрслэлийг хангана. Artifact-ийн JS-ийг
 * хуулаагүй — геометрийн тогтмолуудыг нь үг дуудлагаар авч, дүрмийг нь тестийн
 * дор дахин бичсэн.
 *
 * Artifact-аас ЗОРИУД зөрсөн зүйлс:
 *
 * 1. `wrapLines` нь нэг урт үгийг хүчээр хуваана. Artifact-ийн `wrap` нь түүнийг
 *    мөрөөс гаргадаг тул үг хавтаснаас халиад гардаг. Мөн artifact нь хоосон
 *    текстэд `[""]` буцаадаг, энд `[]`.
 * 2. Escape нь тоон entity (`&#38;`) биш, нэртэй entity (`&amp;`) — lib/seo.ts-ийн
 *    `xmlEscape`-ийг дахин хэрэглэв, RSS/sitemap-тай нэг дүрэм.
 * 3. `<defs>` нь зураг үнэхээр зурагдах үед Л гарна. Artifact нь үргэлж гаргадаг;
 *    motif-ийн тохиолдолд filter ба gradient-ийг хэн ч заадаггүй тул нүүр дээр
 *    12 хавтас байхад 12 ижил `id` үүсгэх нь дэмий.
 * 4. Логог `<use href="#lgD|#lgW">`-ээр биш, текстээр бичив: логоны SVG `<symbol>`
 *    энэ апп-д хараахан байхгүй. 3-р шатны редакцын брэнд тохиргоотой хамт
 *    `<symbol>` орох үед энэ мөрийг солино.
 * 5. Видео тэмдэг (artifact-ийн `n.vid`) ОРООГҮЙ: `NewsPost`-д тохирох талбар
 *    байхгүй. Видеоны ангилал нь `/c/video` гэж шийдэгдсэн.
 */
import { xmlEscape } from "./seo";

export const COVER_W = 474;
export const COVER_H = 900;

/** Хавтасны гурван палитр, artifact-ийн `PAL`. `NewsPost.theme` нь индекс. */
export const PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#0A22E0", "#F3F0EA", "#E86522"],
  ["#F3F0EA", "#0A22E0", "#E86522"],
  ["#E86522", "#F3F0EA", "#0A22E0"],
];

const HEX6 = /^#[0-9a-fA-F]{6}$/;
const LAYOUTS = ["top", "full", "text"] as const;
const FONTS = ["sans", "serif"] as const;
const MAX_TITLE_LINES = 5;
const FEATURED_YELLOW = "#F9CF02";
const INK = "#141414";

export type Motif = "grid" | "hemi" | "cols" | "bars" | "rings" | "sun" | "wave";
export type CoverLayout = (typeof LAYOUTS)[number];

export type CoverLook = {
  bg?: string;
  fg?: string;
  ac?: string;
  lay?: CoverLayout;
  size?: number;
  font?: (typeof FONTS)[number];
  fy?: number;
  duo?: boolean;
};

export type CoverInput = {
  title: string;
  kicker: string | null;
  lead: string | null;
  categoryName: string;
  motif: string;
  theme: number;
  look: CoverLook | null;
  imageUrl: string | null;
  featured: boolean;
  /**
   * ТЕКСТГҮЙ хавтас — зөвхөн дэвсгэр ба хээ.
   *
   * Сторины бүтэн дэлгэцийн давхарга нь гарчиг, ангилал, огноог өөрөө
   * дээр нь хэвлэдэг. Хавтасных мөн гарч ирвэл хоёр гарчиг зөрж, аль нь
   * ч уншигдахгүй.
   */
  plain?: boolean;
  /**
   * Хавтасны доод огноо ("2026.11.26"). Брифийн CoverInput-д байгаагүй боловч
   * artifact-ийн хавтас түүнийг `x=37 y=868`-д хэвлэдэг — дизайныг хадгалах
   * зорилтын дагуу нэмэв. Өгөөгүй бол огнооны мөр гарахгүй.
   */
  date?: Date | null;
};

/** `(r*299 + g*587 + b*114)/1000 > 150` — artifact-ийн `light()`. Яг 150 нь цайвар БИШ. */
export function isLight(hex: string): boolean {
  const v = parseInt(hex.slice(1), 16);
  const r = (v >> 16) & 255;
  const g = (v >> 8) & 255;
  const b = v & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/** theme-ийн палитр, `look`-ийн зөв 6 оронтой hex нь түүнийг дарна. */
export function palette(
  theme: number,
  look: CoverLook | null,
): [string, string, string] {
  const base = PALETTES[theme] ?? PALETTES[0];
  const o = look ?? {};
  return [
    o.bg && HEX6.test(o.bg) ? o.bg : base[0],
    o.fg && HEX6.test(o.fg) ? o.fg : base[1],
    o.ac && HEX6.test(o.ac) ? o.ac : base[2],
  ];
}

/**
 * `NewsPost.look` нь `Json?` — санд дурын бүтэц байж болно. Танихгүй талбар,
 * хүчингүй утгыг хаяж, зөвшөөрөгдсөнийг л үлдээнэ. Хэлбэр нь объект биш
 * (массив, тоо, мөр, null) бол null.
 */
export function parseLook(value: unknown): CoverLook | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const src = value as Record<string, unknown>;
  const out: CoverLook = {};

  for (const key of ["bg", "fg", "ac"] as const) {
    const v = src[key];
    if (typeof v === "string" && HEX6.test(v)) out[key] = v;
  }
  if (typeof src.lay === "string" && (LAYOUTS as readonly string[]).includes(src.lay)) {
    out.lay = src.lay as CoverLayout;
  }
  if (typeof src.font === "string" && (FONTS as readonly string[]).includes(src.font)) {
    out.font = src.font as CoverLook["font"];
  }
  for (const key of ["size", "fy"] as const) {
    const v = src[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
  }
  if (typeof src.duo === "boolean") out.duo = src.duo;

  return out;
}

/**
 * `perLine` тэмдэгтэд тааруулж үгийн зааг дээр мөр хуваана, `max` мөрөөр хязгаарлана.
 * Нэг үг `perLine`-ээс урт бол хүчээр хуваана — хавтаснаас халихгүй байх нь
 * мөрийн тоог хадгалахаас чухал.
 */
export function wrapLines(text: string, perLine: number, max = MAX_TITLE_LINES): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";

  for (const word of words) {
    let w = word;
    // Хэтэрхий урт үгийг бүтэн мөрүүд болгон тасална
    while (w.length > perLine) {
      if (cur) {
        lines.push(cur);
        cur = "";
      }
      lines.push(w.slice(0, perLine));
      w = w.slice(perLine);
    }
    const next = cur ? cur + " " + w : w;
    if (next.length > perLine && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);

  return lines.slice(0, max);
}

/** Зураггүй хавтасны геометрийн хэлбэр. Танихгүй нэр нь `grid`. */
export function motifSvg(kind: string, fg: string, ac: string): string {
  let s = "";

  if (kind === "hemi") {
    for (const r of [80, 100, 120, 140, 160, 180, 200]) {
      const n = Math.round((126 * r) / 980);
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (Math.PI * (i + 0.5)) / n;
        const cx = (237 + r * Math.cos(a)).toFixed(1);
        const cy = (490 + r * Math.sin(a)).toFixed(1);
        s += `<circle cx="${cx}" cy="${cy}" r="7" fill="${i / n < 0.6 ? ac : fg}"/>`;
      }
    }
    s += `<rect x="197" y="470" width="80" height="40" fill="${fg}"/>`;
    s += `<rect x="77" y="520" width="320" height="4" fill="${fg}"/>`;
    return s;
  }

  if (kind === "cols") {
    s += `<polygon points="87,270 237,190 387,270" fill="${fg}"/>`;
    s += `<polygon points="187,256 237,230 287,256" fill="${ac}"/>`;
    s += `<rect x="87" y="276" width="300" height="18" fill="${fg}"/>`;
    for (let i = 0; i < 6; i++) {
      s += `<rect x="${104 + i * 50}" y="304" width="22" height="180" fill="${fg}"/>`;
    }
    for (const i of [0, 1, 2]) {
      s += `<rect x="${77 - i * 14}" y="${492 + i * 14}" width="${320 + i * 28}" height="10" fill="${fg}"/>`;
    }
    return s;
  }

  if (kind === "bars") {
    const heights = [120, 180, 150, 240, 200, 300, 260, 340];
    heights.forEach((v, i) => {
      s += `<rect x="${61 + i * 45}" y="${540 - v}" width="30" height="${v}" fill="${i === 7 ? ac : fg}"/>`;
    });
    s += `<rect x="47" y="544" width="380" height="3" fill="${fg}"/>`;
    return s;
  }

  if (kind === "rings") {
    s += `<g fill="none" stroke="${fg}" stroke-width="3">`;
    s += `<circle cx="237" cy="370" r="170"/>`;
    s += `<ellipse cx="237" cy="370" rx="110" ry="170"/>`;
    s += `<ellipse cx="237" cy="370" rx="45" ry="170"/>`;
    s += `<path d="M67 370h340M90 285h294M90 455h294"/></g>`;
    s += `<circle cx="300" cy="300" r="16" fill="${ac}"/>`;
    s += `<circle cx="150" cy="330" r="10" fill="${ac}"/>`;
    return s;
  }

  if (kind === "sun") {
    s += `<circle cx="237" cy="380" r="92" fill="${ac}"/>`;
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      const x1 = (237 + 112 * Math.cos(a)).toFixed(1);
      const y1 = (380 + 112 * Math.sin(a)).toFixed(1);
      const x2 = (237 + 178 * Math.cos(a)).toFixed(1);
      const y2 = (380 + 178 * Math.sin(a)).toFixed(1);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fg}" stroke-width="5"/>`;
    }
    return s;
  }

  if (kind === "wave") {
    for (let j = 0; j < 9; j++) {
      let p = `M47 ${220 + j * 40}`;
      for (let x = 47; x <= 427; x += 20) {
        p += ` L${x} ${(220 + j * 40 + Math.sin(x / 38 + j * 0.7) * 18).toFixed(1)}`;
      }
      s += `<path d="${p}" fill="none" stroke="${j === 4 ? ac : fg}" stroke-width="${j === 4 ? 7 : 4}"/>`;
    }
    return s;
  }

  // grid — анхдагч: цэгийн тор дээр нэг шугам
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      s += `<circle cx="${61 + i * 44}" cy="${200 + j * 40}" r="4" fill="${fg}"/>`;
    }
  }
  s += `<polyline points="61,520 105,480 149,500 193,400 237,420 281,320 325,340 369,240 413,200" fill="none" stroke="${ac}" stroke-width="8" stroke-linejoin="round"/>`;
  return s;
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Artifact-ийн `fmt`: "2026.11.26". Огноо нь @db.Date тул UTC-ээр. */
function dotDate(d: Date): string {
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${d.getUTCFullYear()}.${m < 10 ? "0" + m : m}.${day < 10 ? "0" + day : day}`;
}

/** Duotone фильтрийн `tableValues`-д хэрэглэх 0..1 хэмжээст өнгө */
function channels(hex: string): [string, string, string] {
  return [1, 3, 5].map((i) =>
    (parseInt(hex.substr(i, 2), 16) / 255).toFixed(3),
  ) as [string, string, string];
}

/** `<svg>` бүрхүүлгүй хавтасны агуулга */
export function coverInner(input: CoverInput): string {
  const [bg, fg, ac] = palette(input.theme, input.look);
  const o = input.look ?? {};

  const lay: CoverLayout = o.lay ?? "top";
  const fs = clamp(0.8, 1.25, o.size || 1);
  const serif = o.font === "serif";
  const family = serif ? "PT Serif,Georgia,serif" : "Inter Tight,sans-serif";
  const lt = isLight(bg);
  const fy = typeof o.fy === "number" && Number.isFinite(o.fy) ? o.fy : 50;
  const duo = o.duo !== false;

  const tsz = (lay === "text" ? 58 : 44) * fs;
  const lineHeight = tsz * 1.14;
  const titleLines = wrapLines(input.title, Math.round((lay === "text" ? 10.5 : 13) / fs));

  // Duotone: бараан→цайвар хоёр өнгөний хооронд дүрсийг дахин зураглана
  const [dark, light] = lt ? [fg, bg] : [bg, fg];
  const a = channels(dark);
  const b = channels(light);
  const fid = "dq" + dark.slice(1) + light.slice(1);
  const defs =
    `<filter id="${fid}" color-interpolation-filters="sRGB">` +
    `<feColorMatrix type="saturate" values="0"/><feComponentTransfer>` +
    `<feFuncR type="table" tableValues="${a[0]} ${b[0]}"/>` +
    `<feFuncG type="table" tableValues="${a[1]} ${b[1]}"/>` +
    `<feFuncB type="table" tableValues="${a[2]} ${b[2]}"/>` +
    `</feComponentTransfer></filter>` +
    `<linearGradient id="g${fid}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${bg}" stop-opacity=".9"/>` +
    `<stop offset=".18" stop-color="${bg}" stop-opacity="0"/>` +
    `<stop offset=".42" stop-color="${bg}" stop-opacity="0"/>` +
    `<stop offset=".78" stop-color="${bg}" stop-opacity=".96"/>` +
    `</linearGradient>`;

  const pa = "xMidY" + (fy < 34 ? "Min" : fy > 66 ? "Max" : "Mid") + " slice";
  const filterAttr = duo ? ` filter="url(#${fid})"` : "";
  const href = input.imageUrl ? xmlEscape(input.imageUrl) : null;

  let art = "";
  let ty = 612;
  let usesDefs = false;

  if (lay === "full" && href) {
    art =
      `<image href="${href}" width="${COVER_W}" height="${COVER_H}" preserveAspectRatio="${pa}"${filterAttr}/>` +
      `<rect width="${COVER_W}" height="${COVER_H}" fill="url(#g${fid})"/>`;
    ty = 830 - (titleLines.length - 1) * lineHeight - 10;
    usesDefs = true;
  } else if (lay === "text") {
    ty = 190 + tsz;
  } else if (href) {
    art = `<image href="${href}" x="0" y="132" width="${COVER_W}" height="452" preserveAspectRatio="${pa}"${filterAttr}/>`;
    usesDefs = true;
  } else {
    art = motifSvg(input.motif, fg, ac);
  }

  // lay=text үед товч агуулгыг хавтсан дээр хэвлэнэ
  let summary = "";
  if (lay === "text" && input.lead) {
    const leadLines = wrapLines(input.lead, 32);
    const sy = ty + (titleLines.length - 1) * lineHeight + 70;
    summary =
      `<rect x="37" y="${(sy - 38).toFixed(0)}" width="64" height="5" fill="${ac}"/>` +
      leadLines
        .map(
          (l, i) =>
            `<text x="37" y="${(sy + i * 31).toFixed(0)}" font-size="21" font-family="Noto Serif,Georgia,serif" opacity=".92">${xmlEscape(l)}</text>`,
        )
        .join("");
  }

  const featured = input.featured
    ? `<rect x="300" y="0" width="137" height="34" fill="${FEATURED_YELLOW}"/>` +
      `<path d="M318 10.5l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" fill="${INK}"/>` +
      `<text x="378" y="23" font-size="15" font-weight="800" text-anchor="middle" fill="${INK}">ОНЦЛОХ</text>`
    : "";

  const dateLine = input.date
    ? `<text x="37" y="868" font-size="18" font-weight="600">${dotDate(input.date)}</text>`
    : "";

  const ground =
    (usesDefs ? `<defs>${defs}</defs>` : "") +
    `<rect width="${COVER_W}" height="${COVER_H}" fill="${bg}"/>` +
    art;

  if (input.plain) return ground;

  return (
    ground +
    `<g font-family="Inter Tight,sans-serif" fill="${fg}">` +
    `<text x="37" y="56" font-size="20" font-weight="800" letter-spacing="1">PARLAMENT NEWS</text>` +
    `<rect x="37" y="74" width="400" height="2"/>` +
    `<text x="37" y="116" font-size="22" font-weight="600">${xmlEscape(input.categoryName)}</text>` +
    titleLines
      .map(
        (l, i) =>
          `<text x="37" y="${(ty + i * lineHeight).toFixed(0)}" font-size="${tsz.toFixed(0)}" font-weight="${serif ? 700 : 800}" font-family="${family}" letter-spacing="${serif ? 0 : -1}">${xmlEscape(l)}</text>`,
      )
      .join("") +
    summary +
    featured +
    dateLine +
    `</g>`
  );
}

/** Бүтэн, дангаараа зурагддаг хавтасны SVG */
export function coverSvg(input: CoverInput): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${xmlEscape(input.title)}">` +
    coverInner(input) +
    `</svg>`
  );
}
