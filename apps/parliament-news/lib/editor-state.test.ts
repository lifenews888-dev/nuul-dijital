import { describe, it, expect } from "vitest";
import {
  storyDaysOf,
  emptyEditor,
  editorFromPost,
  editorToInput,
  editorReducer,
  isDirty,
  DEFAULT_CHANNELS,
  type EditorState,
} from "./editor-state";
import type { StudioPostFull } from "./studio-post";

const POST: StudioPostFull = {
  id: "p1",
  slug: "tosov",
  status: "DRAFT",
  authorId: "u1",
  title: "Төсвийн хэлэлцүүлэг",
  kicker: "Төсөв",
  lead: "Тойм",
  body: "Биет",
  categoryName: "Чуулган",
  subcategory: null,
  date: new Date("2026-11-20T00:00:00Z"),
  reporter: "Б. Номин",
  tags: ["төсөв", "хууль"],
  sources: ["https://parliament.mn/a"],
  motif: "hemi",
  theme: 1,
  look: { bg: "#101010" },
  channels: ["Сайт"],
  featured: true,
  story: false,
  storyUrl: null,
  storyUntil: null,
  publishedAt: null,
  createdAt: new Date("2026-11-20T00:00:00Z"),
  updatedAt: new Date("2026-11-21T10:00:00Z"),
  reviewNote: null,
  media: [],
  bill: null,
};

describe("emptyEditor", () => {
  /** admin.html-ийн `blank()` (:979) */
  it("шинэ мэдээ нь өнөөдрийн огноотой, ноорог", () => {
    const s = emptyEditor("2026-11-27");
    expect(s.date).toBe("2026-11-27");
    expect(s.title).toBe("");
    expect(s.body).toBe("");
  });

  it("artifact-ийн анхдагч сувгууд", () => {
    expect(emptyEditor("2026-11-27").channels).toEqual(DEFAULT_CHANNELS);
    expect(DEFAULT_CHANNELS).toEqual(["Сайт", "Facebook", "YouTube"]);
  });

  it("artifact-ийн анхдагч хээ нь танхим", () => {
    expect(emptyEditor("2026-11-27").motif).toBe("hemi");
  });

  it("сторины анхдагч хугацаа нь нэг өдөр", () => {
    expect(emptyEditor("2026-11-27").storyDays).toBe(1);
    expect(emptyEditor("2026-11-27").story).toBe(false);
  });
});

describe("editorFromPost ба editorToInput", () => {
  it("мэдээнээс төлөв рүү, буцаад оролт руу эвдрэхгүй", () => {
    const input = editorToInput(editorFromPost(POST));
    expect(input.title).toBe(POST.title);
    expect(input.kicker).toBe("Төсөв");
    expect(input.lead).toBe("Тойм");
    expect(input.body).toBe("Биет");
    expect(input.categoryName).toBe("Чуулган");
    expect(input.reporter).toBe("Б. Номин");
    expect(input.motif).toBe("hemi");
    expect(input.theme).toBe(1);
    expect(input.featured).toBe(true);
  });

  /** Огноо нь санд `Date`, формд `YYYY-MM-DD` */
  it("огноог формын хэлбэрт, буцаад", () => {
    expect(editorFromPost(POST).date).toBe("2026-11-20");
    expect(editorToInput(editorFromPost(POST)).date).toBe("2026-11-20");
  });

  it("id ба updatedAt-ийг дамжуулна — зэрэгцээ засварлалт илрүүлэхэд", () => {
    const input = editorToInput(editorFromPost(POST));
    expect(input.id).toBe("p1");
    expect(input.expectedUpdatedAt).toBe(POST.updatedAt.toISOString());
  });

  it("шинэ мэдээнд id байхгүй", () => {
    expect(editorToInput(emptyEditor("2026-11-27")).id).toBeUndefined();
    expect(editorToInput(emptyEditor("2026-11-27")).expectedUpdatedAt).toBeUndefined();
  });

  it("look-ийг хэвээр дамжуулна", () => {
    expect(editorToInput(editorFromPost(POST)).look).toEqual({ bg: "#101010" });
  });

  it("эх сурвалжийг хэвээр", () => {
    expect(editorToInput(editorFromPost(POST)).sources).toEqual(["https://parliament.mn/a"]);
  });
});

describe("шошго — формд мөр, санд массив", () => {
  it("таслалаар задална, хоосныг хаяна", () => {
    const s = editorReducer(emptyEditor("2026-11-27"), {
      type: "set",
      field: "tagsText",
      value: "Төсөв, , Хууль ,Сонгууль",
    });
    expect(editorToInput(s).tags).toEqual(["Төсөв", "Хууль", "Сонгууль"]);
  });

  it("мэдээнээс ирэхэд таслалаар нийлнэ", () => {
    expect(editorFromPost(POST).tagsText).toBe("төсөв, хууль");
  });

  it("хоосон мөр нь хоосон массив", () => {
    const s = editorReducer(emptyEditor("2026-11-27"), {
      type: "set",
      field: "tagsText",
      value: "   ",
    });
    expect(editorToInput(s).tags).toEqual([]);
  });

  /** Давхардсан шошго нь хоёр ижил чип болно */
  it("давхардлыг хасна", () => {
    const s = editorReducer(emptyEditor("2026-11-27"), {
      type: "set",
      field: "tagsText",
      value: "Төсөв, төсөв, Төсөв",
    });
    expect(editorToInput(s).tags).toEqual(["Төсөв"]);
  });
});

describe("editorReducer", () => {
  it("талбар солиход ШИНЭ объект — React дахин зурна", () => {
    const a = emptyEditor("2026-11-27");
    const b = editorReducer(a, { type: "set", field: "title", value: "Шинэ" });
    expect(b.title).toBe("Шинэ");
    expect(a.title).toBe("");
    expect(b).not.toBe(a);
  });

  it("бүхэлд нь сэргээнэ — хадгалсны дараа", () => {
    const a = emptyEditor("2026-11-27");
    const b = editorReducer(a, { type: "reset", state: editorFromPost(POST) });
    expect(b.title).toBe(POST.title);
  });

  it("look-ийн нэг түлхүүрийг солино", () => {
    const a = editorFromPost(POST);
    const b = editorReducer(a, { type: "look", key: "bg", value: "#FFFFFF" });
    expect((b.look as Record<string, unknown>).bg).toBe("#FFFFFF");
    expect((a.look as Record<string, unknown>).bg).toBe("#101010");
  });

  it("look-ийг цэвэрлэнэ — «Анхны байдалд»", () => {
    const b = editorReducer(editorFromPost(POST), { type: "look", key: null, value: null });
    expect(b.look).toEqual({});
  });
});

describe("isDirty", () => {
  it("өөрчлөгдөөгүй бол цэвэр", () => {
    const a = emptyEditor("2026-11-27");
    expect(isDirty(a, a)).toBe(false);
    expect(isDirty(a, { ...a })).toBe(false);
  });

  it("аль ч талбар өөрчлөгдвөл бохир", () => {
    const a = emptyEditor("2026-11-27");
    expect(isDirty(a, editorReducer(a, { type: "set", field: "title", value: "X" }))).toBe(true);
    expect(isDirty(a, editorReducer(a, { type: "look", key: "bg", value: "#000000" }))).toBe(true);
  });

  /** Хадгалсны дараа «хадгалаагүй өөрчлөлт» гэж сэрэмжлүүлэх ёсгүй */
  it("мэдээнээс дахин үүсгэсэн төлөв нь цэвэр", () => {
    const a: EditorState = editorFromPost(POST);
    expect(isDirty(a, editorFromPost(POST))).toBe(false);
  });
});

/**
 * C1 — супер админы төлөвийн сонголт.
 *
 * `canSetStatusManually`-ийн бүх хэлхээ (схем, `pickEditable`, роутерын
 * тест) БАЙСАН ч `editorToInput` нь `status`-ийг илгээдэггүй байв:
 * супер админ «Нийтлэгдсэн» гэж сонгоод хадгалахад «Бүх өөрчлөлт
 * хадгалагдсан» гэсэн мессеж гарч, мөр нь ноорог хэвээр үлддэг.
 */
describe("төлөв нь оролтод орно (C1)", () => {
  it("байгаа мэдээний төлөвийг илгээнэ", () => {
    const s = editorReducer(editorFromPost(POST), {
      type: "set",
      field: "status",
      value: "PUBLISHED",
    });
    expect(editorToInput(s).status).toBe("PUBLISHED");
  });

  /** Шинэ мэдээ ҮРГЭЛЖ ноорог — сервер ч дарна, клиент ч илгээхгүй */
  it("шинэ мэдээнд төлөв илгээхгүй", () => {
    expect(editorToInput(emptyEditor("2026-11-27")).status).toBeUndefined();
  });
});

/**
 * C2 — хадгалсны дараа `expectedUpdatedAt` шинэчлэгдэх ёстой.
 *
 * Үгүй бол нэг хуудас ачаалалтад ЗӨВХӨН НЭГ УДАА хадгалж болно:
 * хоёр дахь нь «өөр хүн засаж өөрчлөгдсөн» гэсэн ХУУРАМЧ зөрчил авна.
 */
describe("хадгалсны дараах тэмдэг (C2)", () => {
  it("шинэ updatedAt-аар сэргээнэ", () => {
    const a = editorFromPost(POST);
    const b = editorReducer(a, {
      type: "saved",
      id: POST.id,
      updatedAt: "2026-11-22T10:00:00.000Z",
    });
    expect(b.expectedUpdatedAt).toBe("2026-11-22T10:00:00.000Z");
    expect(b.id).toBe(POST.id);
  });

  it("хэрэглэгчийн бичсэнийг ХАДГАЛНА — зөвхөн тэмдгийг солино", () => {
    let a = editorFromPost(POST);
    a = editorReducer(a, { type: "set", field: "title", value: "Шинэ гарчиг" });
    const b = editorReducer(a, { type: "saved", id: POST.id, updatedAt: "2026-11-22T10:00:00.000Z" });
    expect(b.title).toBe("Шинэ гарчиг");
  });

  it("шинэ мэдээний id-г тавина — дараагийн хадгалалт шинийг үүсгэхгүй", () => {
    const a = emptyEditor("2026-11-27");
    const b = editorReducer(a, { type: "saved", id: "new-1", updatedAt: "2026-11-27T00:00:00.000Z" });
    expect(editorToInput(b).id).toBe("new-1");
  });
});

/**
 * I1 — сторины хугацаа хадгалалт бүрт сунах ёсгүй.
 *
 * `storyDaysOf` нь ҮЛДСЭН хугацаагаар сонголтыг таамагладаг байв:
 * 7 хоногийн стори гурав дахь өдөр засагдахад дахин 7 хоног авч,
 * өдөр бүр засагддаг мэдээ ХЭЗЭЭ Ч дуусахгүй болно.
 */
describe("сторины хугацаа (I1)", () => {
  const now = new Date("2026-11-27T12:00:00Z");
  const post = (over: Partial<StudioPostFull>): StudioPostFull => ({ ...POST, ...over });

  it("стори биш бол анхдагч нэг өдөр", () => {
    expect(storyDaysOf(post({ story: false, storyUntil: null }), now)).toBe(1);
  });

  it("хугацаагүй стори нь тэг", () => {
    expect(storyDaysOf(post({ story: true, storyUntil: null }), now)).toBe(0);
  });

  /** Хадгалсан хугацааг ҮЛДСЭНЭЭР нь биш, ҮҮССЭНЭЭР нь сэргээнэ */
  it("дуусахад гурав хоногтой 7 хоногийн стори нь 7 хэвээр", () => {
    const created = new Date("2026-11-24T12:00:00Z");
    const until = new Date(created.getTime() + 7 * 86_400_000);
    expect(storyDaysOf(post({ story: true, storyUntil: until, createdAt: created }), now)).toBe(7);
  });

  it("хугацаа нь өнгөрсөн стори нь сэргэхгүй — тэг хоног", () => {
    const until = new Date(now.getTime() - 10 * 86_400_000);
    expect(storyDaysOf(post({ story: true, storyUntil: until }), now)).toBe(0);
  });
});
