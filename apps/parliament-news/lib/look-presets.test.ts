import { describe, it, expect } from "vitest";
import {
  LOOK_PRESETS,
  LAYOUT_CHOICES,
  FONT_CHOICES,
  FOCUS_CHOICES,
  SIZE_RANGE,
  MOTIF_CHOICES,
  resetLook,
} from "./look-presets";

/**
 * Дизайн мастерын сонголтууд — admin.html-ийн `PRESETS` (:1098) ба
 * `.dmc`-ийн хяналтууд (:637-648).
 *
 * Эдгээрийг компонентод шууд бичвэл тест хүрэхгүй: «Төрийн далбаа»-ийн
 * улаан нэг оронгоор зөрөхөд хэн ч анзаарахгүй, гэтэл хавтас бүр
 * буруу өнгөтэй болно.
 */
describe("LOOK_PRESETS", () => {
  it("artifact-ийн найман бэлэн загвар, дарааллаар нь", () => {
    expect(LOOK_PRESETS.map((p) => p.name)).toEqual([
      "Брэнд цэнхэр",
      "Цаасан",
      "Улбар шар",
      "Шөнийн",
      "Төрийн далбаа",
      "Хар цагаан",
      "Мэдээллийн",
      "Тэнгэр",
    ]);
  });

  it("эхний гурав нь зөвхөн палитрын дугаар", () => {
    expect(LOOK_PRESETS[0]).toEqual({ name: "Брэнд цэнхэр", theme: 0, look: {} });
    expect(LOOK_PRESETS[1]).toEqual({ name: "Цаасан", theme: 1, look: {} });
    expect(LOOK_PRESETS[2]).toEqual({ name: "Улбар шар", theme: 2, look: {} });
  });

  it("«Шөнийн» нь бараан дэвсгэртэй", () => {
    const n = LOOK_PRESETS.find((p) => p.name === "Шөнийн")!;
    expect(n.look).toEqual({ bg: "#0E1426", fg: "#F3F0EA", ac: "#E86522" });
  });

  it("«Төрийн далбаа» нь улаан, цагаан, шар", () => {
    const f = LOOK_PRESETS.find((p) => p.name === "Төрийн далбаа")!;
    expect(f.look).toEqual({ bg: "#C4272F", fg: "#FFFFFF", ac: "#F9CF02" });
    expect(f.theme).toBe(2);
  });

  it("«Хар цагаан»", () => {
    const b = LOOK_PRESETS.find((p) => p.name === "Хар цагаан")!;
    expect(b.look).toEqual({ bg: "#141414", fg: "#FFFFFF", ac: "#E86522" });
  });

  it("«Мэдээллийн» нь serif, зөвхөн текст", () => {
    const n = LOOK_PRESETS.find((p) => p.name === "Мэдээллийн")!;
    expect(n.look.font).toBe("serif");
    expect(n.look.lay).toBe("text");
    expect(n.look.bg).toBe("#FFFFFF");
  });

  it("«Тэнгэр»", () => {
    const s = LOOK_PRESETS.find((p) => p.name === "Тэнгэр")!;
    expect(s.look).toEqual({ bg: "#0B5FA5", fg: "#FFFFFF", ac: "#F9CF02" });
  });

  it("өнгөнүүд нь зургаан оронтой hex — cover.ts-ийн parseLook шаардана", () => {
    for (const p of LOOK_PRESETS) {
      for (const key of ["bg", "fg", "ac"] as const) {
        const v = p.look[key];
        if (v !== undefined) expect(v).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });
});

describe("хяналтын сонголтууд", () => {
  it("гурван зохиомж", () => {
    expect(LAYOUT_CHOICES.map((l) => l.value)).toEqual(["top", "full", "text"]);
    expect(LAYOUT_CHOICES.map((l) => l.label)).toEqual([
      "Зураг дээр",
      "Бүтэн зураг",
      "Зөвхөн текст",
    ]);
  });

  it("хоёр фонт", () => {
    expect(FONT_CHOICES.map((f) => f.value)).toEqual(["sans", "serif"]);
    expect(FONT_CHOICES.map((f) => f.label)).toEqual(["Шинэлэг", "Сонгодог"]);
  });

  it("зургийн төвлөрөл нь 15/50/85", () => {
    expect(FOCUS_CHOICES.map((f) => f.value)).toEqual([15, 50, 85]);
    expect(FOCUS_CHOICES.map((f) => f.label)).toEqual(["Дээд", "Дунд", "Доод"]);
  });

  it("гарчгийн хэмжээ 80-125, таван алхамаар", () => {
    expect(SIZE_RANGE).toEqual({ min: 80, max: 125, step: 5 });
  });

  it("artifact-ийн долоон хээ", () => {
    expect(MOTIF_CHOICES.map((m) => m.value)).toEqual([
      "hemi",
      "cols",
      "bars",
      "rings",
      "sun",
      "wave",
      "grid",
    ]);
    expect(MOTIF_CHOICES[0].label).toBe("УИХ-ын танхим (126 суудал)");
    expect(MOTIF_CHOICES[6].label).toBe("Өсөлтийн шугам");
  });
});

describe("resetLook", () => {
  it("анхны байдалд өнгө, зохиомж үлдэхгүй", () => {
    expect(resetLook()).toEqual({});
  });

  it("шинэ объект буцаана — хуваалцсан төлөв үүсгэхгүй", () => {
    expect(resetLook()).not.toBe(resetLook());
  });
});
