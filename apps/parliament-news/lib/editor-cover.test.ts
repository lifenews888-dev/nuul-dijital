import { describe, it, expect } from "vitest";
import { editorCoverInput } from "./editor-cover";
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
