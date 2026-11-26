/**
 * 3D номын тавиурын геометр — ЦЭВЭР функцууд.
 *
 * Бүх тоон логик энд байгаа нь зориуд: `shelf3d.tsx` нь rAF ба DOM-оос өөр
 * юу ч хийхгүй, тул каруселийн зан төлөвийг тестээр барьж болно.
 *
 * Эх сурвалж: `site-v2/index.html`-ийн `measure()` ба `frame()`. Ижил
 * хөдөлгүүрийн цэвэр хувилбарыг `reference/vhs-archive.html`-д барьж,
 * ажиллаж байгааг нүдээр баталсан.
 *
 * VHS-ээс ЗӨРӨХ ганц зүйл нь объектын харьцаа: хуурцаг нимгэн
 * (`ws = H·142/840`, `d = H·474/900`, 2 талтай), ном зузаан
 * (`ws = H·0.25`, `d = H·0.62`, 4 талтай). Бусад бүх томьёо адилхан.
 */

/** CSS-ийн `perspective` — DOM-д ч, энд ч ижил байх ёстой */
export const PERSPECTIVE = 1400;

const SPINE_RATIO = 0.25; // ws / H — номын зузаан
const COVER_RATIO = 0.62; // d  / H — хавтасны өргөн
const GAP_RATIO = 0.035;
const FALLOFF_DESKTOP = 1.3; // U / H
const FALLOFF_MOBILE = 1.05;
const MOBILE_MAX = 768;

/** Дэлгэцэн дээрх масштабын уналтын илтгэгч */
const FALLOFF_POWER = 1.6;
/** Нуруугаар зогссон номны хажуу эргэлт (градус) */
const SIDE_ROTATION = 26;
/** Энэ нумын уртаас цааш ном харагдахгүй */
const HIDE_AT = 1.95;
/** Пүршний хурд: чирэхэд богино, суллахад удаан */
const SPRING_DRAG = 18;
const SPRING_FREE = 5.2;
/** Таб руу буцахад үсрэхгүйн тулд кадрын алхам хязгаарлагдана */
const MAX_DT = 0.05;

export type ShelfMetrics = {
  H: number;
  ws: number;
  d: number;
  gap: number;
  U: number;
  /** `xOffset`-ийн урьдчилсан интеграл, 2px-ийн алхамтай */
  xs: number[];
};

/**
 * `#probe` элементийн бодит өндрөөс тавиурын бүх хэмжээг гаргана.
 *
 * `probeHeight` нь 0 эсвэл тоо биш үед 1 гэж үзнэ — энэ функц хэзээ ч
 * `NaN` агуулсан бүтэц буцаахгүй, эс бөгөөс бүхэл тавиур алга болно.
 */
export function metrics(probeHeight: number, viewportWidth: number): ShelfMetrics {
  const H = Number.isFinite(probeHeight) && probeHeight > 0 ? probeHeight : 1;
  const U = H * (viewportWidth < MOBILE_MAX ? FALLOFF_MOBILE : FALLOFF_DESKTOP);

  // Дэлгэцэн дээрх х байрлал нь масштабын интеграл: хол номнууд нягтарна
  const xs: number[] = [];
  let acc = 0;
  for (let u = 0; u <= 3 * U; u += 2) {
    xs.push(acc);
    acc += 2 / (1 + Math.pow(u / U, FALLOFF_POWER));
  }

  return { H, ws: H * SPINE_RATIO, d: H * COVER_RATIO, gap: H * GAP_RATIO, U, xs };
}

export function smoothstep(x: number): number {
  return x * x * (3 - 2 * x);
}

/** Нээлттэй хавтас хөршүүдээ зөөлөн түлхэх муруй */
export function bump(r: number): number {
  return Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;
}

/** Төвөөс хойших нумын урт */
export function along(r: number, m: ShelfMetrics): number {
  return r * (m.ws + m.gap) + (m.d - m.ws + 1.4 * m.gap) * bump(r);
}

/** Тойрог дээрх хамгийн ойрын харьцангуй индекс, [-total/2, total/2) */
export function relIndex(v: number, s: number, total: number): number {
  if (!Number.isFinite(total) || total <= 1) return 0;
  const r = (((v - s) % total) + total) % total;
  return r >= total / 2 ? r - total : r;
}

/** Нумын уртыг дэлгэцийн х болгоно */
export function xOffset(u: number, m: ShelfMetrics): number {
  const i = Math.min(m.xs.length - 1, Math.floor(Math.abs(u) / 2));
  return Math.sign(u) * m.xs[i];
}

export type BookPose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  zIndex: number;
  hidden: boolean;
  shadeSpine: number;
  shadeCover: number;
  shadeBack: number;
};

/**
 * Нэг номны кадрын байрлал.
 *
 * `o` нь «нээлттэй байдал»: нуруугаар зогссонд 0, бүрэн эргэж хавтсаа
 * харуулсанд 1. Эргэлт, гүн, сүүдэр, налалт бүгд түүгээр холилдоно.
 *
 * Дөрөв дэх тал (хуудасны ирмэг) сүүдэргүй: artifact-д тэр нь өөрийн
 * давхар градиенттэй, `--shade` хэрэглэдэггүй.
 */
export function bookPose(input: {
  index: number;
  s: number;
  total: number;
  m: ShelfMetrics;
  lift: number;
  tiltX: number;
  tiltY: number;
}): BookPose {
  const { index, s, total, m, lift, tiltX, tiltY } = input;

  const r = relIndex(index, s, total);
  const o = smoothstep(Math.max(0, 1 - Math.abs(r)));
  const u = along(r, m);

  const scale = 1 / (1 + Math.pow(Math.abs(u) / m.U, FALLOFF_POWER));
  const k = 1 / scale;

  const z = PERSPECTIVE * (1 - k) + o * m.H * 0.1;
  const x = xOffset(u, m) * k;
  const y = (m.H * 0.5 * (1 - scale) * 0.42 + o * m.H * 0.012 - lift * m.H * 0.05) * k;

  const ry =
    Math.sign(u) * Math.min(1, Math.abs(u) / m.U) * SIDE_ROTATION * (1 - o) - 90 * o + tiltY * o;

  return {
    x,
    y,
    z,
    rx: tiltX * o,
    ry,
    zIndex: Math.round(3000 + z),
    hidden: Math.abs(u) > m.U * HIDE_AT,
    shadeSpine: Math.min(0.6, o * 0.55 + (1 - scale) * 0.32),
    shadeCover: (1 - o) * 0.82,
    shadeBack: 0.5,
  };
}

/** Пүршин ойртолт. `dt` хязгаарлагдсан тул таб руу буцахад үсрэхгүй. */
export function springStep(
  s: number,
  target: number,
  dt: number,
  dragging: boolean,
): number {
  const step = Math.min(MAX_DT, Math.max(0, dt));
  const k = dragging ? SPRING_DRAG : SPRING_FREE;
  return s + (target - s) * (1 - Math.exp(-k * step));
}
