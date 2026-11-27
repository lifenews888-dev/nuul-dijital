import { describe, it, expect } from "vitest";
import { editorCoverInput, sizePercent, sizeFraction, duoOn } from "./editor-cover";
import { emptyEditor, editorReducer, type EditorState } from "./editor-state";

const base = (): EditorState => {
  let s = emptyEditor("2026-11-27");
  s = editorReducer(s, { type: "set", field: "title", value: "Төсвийн хэлэлцүүлэг" });
  s = editorReducer(s, { type: "set", field: "categoryName", value: "Чуулган" });
  s = editorReducer(s, { type: "set", field: "lead", value: "Тойм" });
  s = editorReducer(s, { type: "set", field: "kicker", value: "Төсөв" });
  return s;
};

/**
 * Формын төлөвөөс хавтасны оролт руу.
 *
 * Хавтсыг `lib/cover.ts` ГАНЦААРАА зурна — хоёр дахь зурагч бичвэл тэд
 * салж, редактор номоо худал харна. Энэ функц нь зөвхөн ХӨРВҮҮЛЭЛТ.
 */
describe("editorCoverInput", () => {
  it("гарчиг, ангилал, нуруу, тойм нь хавтас руу очно", () => {
    const c = editorCoverInput(base(), null);
    expect(c.title).toBe("Төсвийн хэлэлцүүлэг");
    expect(c.categoryName).toBe("Чуулган");
    expect(c.kicker).toBe("Төсөв");
    expect(c.lead).toBe("Тойм");
  });

  /** Хоосон ном нь загвар биш, алдаа мэт харагдана */
  it("гарчиггүй үед орлуулагч текст", () => {
    const s = editorReducer(base(), { type: "set", field: "title", value: "" });
    expect(editorCoverInput(s, null).title).toBe("(гарчиггүй)");
  });

  it("ангилалгүй үед ч хавтас зурагдана", () => {
    const s = editorReducer(base(), { type: "set", field: "categoryName", value: "" });
    expect(editorCoverInput(s, null).categoryName).toBe("Мэдээ");
  });

  it("эхний зураг нь хавтас болно", () => {
    expect(editorCoverInput(base(), "https://b.mn/a.jpg").imageUrl).toBe("https://b.mn/a.jpg");
  });

  it("зураггүй бол null — хээ зурагдана", () => {
    expect(editorCoverInput(base(), null).imageUrl).toBeNull();
  });

  it("онцлохыг дамжуулна — хавтас дээр од гарна", () => {
    const s = editorReducer(base(), { type: "set", field: "featured", value: true });
    expect(editorCoverInput(s, null).featured).toBe(true);
  });

  it("хээ, өнгөний загвар, look-ийг дамжуулна", () => {
    let s = editorReducer(base(), { type: "set", field: "motif", value: "cols" });
    s = editorReducer(s, { type: "set", field: "theme", value: 2 });
    s = editorReducer(s, { type: "look", key: "bg", value: "#112233" });
    const c = editorCoverInput(s, null);
    expect(c.motif).toBe("cols");
    expect(c.theme).toBe(2);
    expect(c.look?.bg).toBe("#112233");
  });

  /** `parseLook` нь буруу утгыг хаяна — урьдчилан харалт унах ёсгүй */
  it("буруу look-ийг цэвэрлэнэ", () => {
    const s = editorReducer(base(), { type: "look", key: "bg", value: "ТОМ УТГА" });
    expect(editorCoverInput(s, null).look?.bg).toBeUndefined();
  });

  /** `CoverInput.date` нь `Date` — хавтасны доод мөрөнд */
  it("огноог хавтасны доод мөрөнд", () => {
    expect(editorCoverInput(base(), null).date?.toISOString().slice(0, 10)).toBe("2026-11-27");
  });

  it("буруу огноонд унахгүй — огнооны мөр гарахгүй", () => {
    const s = editorReducer(base(), { type: "set", field: "date", value: "" });
    expect(() => editorCoverInput(s, null)).not.toThrow();
    expect(editorCoverInput(s, null).date).toBeNull();
  });
});

/**
 * C3 — гарчгийн хэмжээ: UI нь ХУВЬ, хавтас нь ЭЗЛЭХҮҮН.
 *
 * `cover.ts` нь `clamp(0.8, 1.25, o.size || 1)` гэж уншдаг. UI нь 80-125
 * гэж бичиж байсан тул ЯМАР Ч байрлал 1.25 болж хавчигдаж, гарчиг
 * хамгийн том хэмжээнд түгжигдэж, урт гарчиг тавиурын хавтсан дээр
 * таслагдаж байв. `admin.html:1109` нь 100-д хуваадаг.
 */
describe("гарчгийн хэмжээ (C3)", () => {
  it("хувиас эзлэхүүн рүү", () => {
    expect(sizeFraction(100)).toBe(1);
    expect(sizeFraction(80)).toBe(0.8);
    expect(sizeFraction(125)).toBe(1.25);
  });

  it("эзлэхүүнээс хувь рүү", () => {
    expect(sizePercent(1)).toBe(100);
    expect(sizePercent(0.8)).toBe(80);
    expect(sizePercent(1.25)).toBe(125);
  });

  it("тавиагүй бол 100 хувь", () => {
    expect(sizePercent(undefined)).toBe(100);
  });

  it("буцаж эргэхэд эвдрэхгүй", () => {
    for (const p of [80, 85, 90, 95, 100, 105, 110, 115, 120, 125]) {
      expect(sizePercent(sizeFraction(p))).toBe(p);
    }
  });

  /** Хавтас руу ЭЗЛЭХҮҮН очно, хувь биш */
  it("хавтасны оролтод эзлэхүүнээр очно", () => {
    const s = editorReducer(base(), { type: "look", key: "size", value: 0.8 });
    expect(editorCoverInput(s, null).look?.size).toBe(0.8);
  });
});

/**
 * I3 — хоёр өнгөөр будах нь АНХДАГЧААР АСААЛТТАЙ.
 *
 * `cover.ts` нь `o.duo !== false` гэж уншдаг: тавиагүй бол асаалттай.
 * UI нь `duo === true` гэж уншиж байсан тул шинэ мэдээн дээр нүд нь
 * хоосон атлаа зураг будагдсан байж, нэг дарахад юу ч өөрчлөгдөхгүй.
 */
describe("хоёр өнгөөр будах (I3)", () => {
  it("тавиагүй бол АСААЛТТАЙ", () => {
    expect(duoOn(undefined)).toBe(true);
  });

  it("зориуд унтраасан бол унтраалттай", () => {
    expect(duoOn(false)).toBe(false);
  });

  it("зориуд асаасан бол асаалттай", () => {
    expect(duoOn(true)).toBe(true);
  });
});
