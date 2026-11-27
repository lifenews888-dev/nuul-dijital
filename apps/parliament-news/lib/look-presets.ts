import type { CoverLook, CoverLayout, Motif } from "./cover";

/**
 * Дизайн мастерын сонголтууд — admin.html-ийн `PRESETS` (:1098) ба
 * `.dmc`-ийн хяналтууд (:637-648).
 *
 * Компонентод шууд бичвэл тест хүрэхгүй: «Төрийн далбаа»-ийн улаан нэг
 * оронгоор зөрөхөд хэн ч анзаарахгүй, гэтэл хавтас бүр буруу өнгөтэй
 * болно.
 */

export type LookPreset = { name: string; theme: number; look: CoverLook };

/**
 * Эхний гурав нь `lib/cover.ts`-ийн PALETTES-ийн дугаар л — өөрийн
 * өнгөгүй. Бусад нь палитрыг дарж бичнэ.
 */
export const LOOK_PRESETS: LookPreset[] = [
  { name: "Брэнд цэнхэр", theme: 0, look: {} },
  { name: "Цаасан", theme: 1, look: {} },
  { name: "Улбар шар", theme: 2, look: {} },
  { name: "Шөнийн", theme: 0, look: { bg: "#0E1426", fg: "#F3F0EA", ac: "#E86522" } },
  { name: "Төрийн далбаа", theme: 2, look: { bg: "#C4272F", fg: "#FFFFFF", ac: "#F9CF02" } },
  { name: "Хар цагаан", theme: 0, look: { bg: "#141414", fg: "#FFFFFF", ac: "#E86522" } },
  {
    name: "Мэдээллийн",
    theme: 1,
    look: { bg: "#FFFFFF", fg: "#141414", ac: "#C4272F", font: "serif", lay: "text" },
  },
  { name: "Тэнгэр", theme: 0, look: { bg: "#0B5FA5", fg: "#FFFFFF", ac: "#F9CF02" } },
];

export const LAYOUT_CHOICES: { value: CoverLayout; label: string }[] = [
  { value: "top", label: "Зураг дээр" },
  { value: "full", label: "Бүтэн зураг" },
  { value: "text", label: "Зөвхөн текст" },
];

export const FONT_CHOICES: { value: "sans" | "serif"; label: string }[] = [
  { value: "sans", label: "Шинэлэг" },
  { value: "serif", label: "Сонгодог" },
];

/** Зургийн босоо төвлөрөл, хувиар — admin.html-ийн `fy` */
export const FOCUS_CHOICES: { value: number; label: string }[] = [
  { value: 15, label: "Дээд" },
  { value: 50, label: "Дунд" },
  { value: 85, label: "Доод" },
];

export const SIZE_RANGE = { min: 80, max: 125, step: 5 } as const;

/** admin.html-ийн `MOTS` — `lib/cover.ts` нь жагсаалт экспортлодоггүй */
export const MOTIF_CHOICES: { value: Motif; label: string }[] = [
  { value: "hemi", label: "УИХ-ын танхим (126 суудал)" },
  { value: "cols", label: "Ордны багана" },
  { value: "bars", label: "Багана график" },
  { value: "rings", label: "Бөмбөрцөг" },
  { value: "sun", label: "Нар" },
  { value: "wave", label: "Долгион" },
  { value: "grid", label: "Өсөлтийн шугам" },
];

/** «Анхны байдалд» — өнгө, зохиомж, фонт бүгд палитр руу буцна */
export function resetLook(): CoverLook {
  return {};
}
