import { describe, it, expect } from "vitest";
import type { NewsRole } from "@nuul/db-news";
import {
  FIELD_SECTION,
  postInputSchema,
  pickEditable,
  type PostInput,
} from "./studio-post-input";
import type { Actor, PostRef } from "./permissions";

const act = (role: NewsRole, userId = "u1"): Actor => ({ userId, role });
const post = (p: Partial<PostRef> = {}): PostRef => ({
  id: "p1",
  status: "DRAFT",
  authorId: "u1",
  ...p,
});

const D = "2026-11-27";
const MIN: PostInput = { title: "Гарчиг", date: D };

/** Бүх хэсгийг хамарсан оролт */
const FULL: PostInput = {
  title: "Гарчиг",
  date: D,
  kicker: "Нуруу",
  lead: "Тойм",
  body: "Биет",
  categoryName: "Чуулган",
  reporter: "Б. Номин",
  tags: ["төсөв"],
  sources: ["https://parliament.mn/a"],
  motif: "hemi",
  theme: 1,
  look: { bg: "#000000" },
  billEnabled: true,
  billStage: 2,
  channels: ["Сайт"],
  featured: true,
};

describe("FIELD_SECTION", () => {
  /** admin.html-ийн `data-sec` атрибутууд (:577-672) */
  it("талбар бүр artifact-ийн хэсэгт харьяална", () => {
    expect(FIELD_SECTION.title).toBe("basic");
    expect(FIELD_SECTION.body).toBe("basic");
    expect(FIELD_SECTION.lead).toBe("basic");
    expect(FIELD_SECTION.categoryName).toBe("basic");
    expect(FIELD_SECTION.tags).toBe("basic");
    expect(FIELD_SECTION.sources).toBe("src");
    expect(FIELD_SECTION.look).toBe("look");
    expect(FIELD_SECTION.motif).toBe("look");
    expect(FIELD_SECTION.theme).toBe("look");
    expect(FIELD_SECTION.billStage).toBe("bill");
    expect(FIELD_SECTION.votesYes).toBe("bill");
    expect(FIELD_SECTION.channels).toBe("pub");
    expect(FIELD_SECTION.featured).toBe("pub");
    expect(FIELD_SECTION.story).toBe("pub");
  });

  /** Нэг ч талбар хэсэггүй үлдэж болохгүй — үлдвэл чимээгүй шүүгдэнэ */
  it("схемийн талбар бүр хэсэгтэй", () => {
    const fields = Object.keys(postInputSchema.parse(FULL));
    const exempt = ["id", "expectedUpdatedAt", "status", "date"];
    for (const f of fields) {
      if (exempt.includes(f)) continue;
      expect(FIELD_SECTION[f], `«${f}» талбар хэсэггүй`).toBeDefined();
    }
  });
});

describe("pickEditable", () => {
  /** Review Focus #1 — нуусан талбар нь хамгаалалт биш */
  it("зураг видеоны редактор ГАРЧГИЙГ бичихгүй", () => {
    const r = pickEditable(act("MEDIA"), post(), FULL);
    expect(r.data.title).toBeUndefined();
    expect(r.data.body).toBeUndefined();
    expect(r.dropped).toContain("title");
  });

  it("хуулийн хариуцагч зөвхөн bill, src-ийг бичнэ", () => {
    const r = pickEditable(act("LEGAL"), post(), FULL);
    expect(r.data.billStage).toBe(2);
    expect(r.data.sources).toEqual(["https://parliament.mn/a"]);
    expect(r.data.title).toBeUndefined();
    expect(r.data.channels).toBeUndefined();
  });

  it("сошиал менежер зөвхөн нийтлэх хэсгийг", () => {
    const r = pickEditable(act("SOCIAL"), post({ status: "APPROVED" }), FULL);
    expect(r.data.channels).toEqual(["Сайт"]);
    expect(r.data.featured).toBe(true);
    expect(r.data.title).toBeUndefined();
  });

  it("сэтгүүлч өөрийн ноорогт бүх хэсгээ бичнэ", () => {
    const r = pickEditable(act("REPORTER"), post(), FULL);
    expect(r.data.title).toBe("Гарчиг");
    expect(r.data.look).toEqual({ bg: "#000000" });
    /** Сэтгүүлчид `pub` хэсэг БАЙХГҮЙ — admin.html-ийн SECS */
    expect(r.data.channels).toBeUndefined();
    expect(r.dropped).toContain("channels");
  });

  /** Review Focus #1 ба #3-ийн уулзвар */
  it("сэтгүүлч БУСДЫН мэдээнд юу ч бичихгүй", () => {
    const r = pickEditable(act("REPORTER"), post({ authorId: "u2" }), FULL);
    expect(Object.keys(r.data)).toEqual([]);
    expect(r.dropped.length).toBeGreaterThan(5);
  });

  it("сэтгүүлч хянагдаж буй мэдээндээ ч хүрэхгүй", () => {
    expect(Object.keys(pickEditable(act("REPORTER"), post({ status: "REVIEW" }), FULL).data))
      .toEqual([]);
  });

  it("медиа редактор нийтлэгдсэн мэдээнд хүрэхгүй", () => {
    expect(Object.keys(pickEditable(act("MEDIA"), post({ status: "PUBLISHED" }), FULL).data))
      .toEqual([]);
  });

  it("төлөвийг зөвхөн супер админ гараар тавина", () => {
    const withStatus = { ...FULL, status: "PUBLISHED" as const };
    expect(pickEditable(act("CHIEF"), post(), withStatus).data.status).toBeUndefined();
    expect(pickEditable(act("SUPER"), post(), withStatus).data.status).toBe("PUBLISHED");
  });

  it("огноо нь үндсэн хэсэгт — засагчтай хамт явна", () => {
    expect(pickEditable(act("REPORTER"), post(), FULL).data.date).toBe(D);
    expect(pickEditable(act("MEDIA"), post(), FULL).data.date).toBeUndefined();
  });

  it("шинэ мэдээнд (id null) сэтгүүлч бичиж чадна", () => {
    const r = pickEditable(act("REPORTER"), post({ id: null, authorId: null }), FULL);
    expect(r.data.title).toBe("Гарчиг");
  });

  it("юу хаягдсаныг нэрлэнэ — дуудагч хэрэглэгчид хэлж чадна", () => {
    const r = pickEditable(act("LEGAL"), post(), FULL);
    expect(r.dropped).toContain("title");
    expect(r.dropped).not.toContain("billStage");
  });
});

describe("postInputSchema", () => {
  it("admin.html-ийн хязгаарууд", () => {
    expect(() => postInputSchema.parse({ ...MIN, title: "a".repeat(161) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, kicker: "a".repeat(41) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, categoryName: "a".repeat(41) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, reporter: "a".repeat(61) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, lead: "a".repeat(301) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, body: "a".repeat(8001) })).toThrow();
  });

  it("хязгаарын дотор нь зөвшөөрнө", () => {
    expect(() => postInputSchema.parse({ ...MIN, title: "a".repeat(160) })).not.toThrow();
    expect(() => postInputSchema.parse({ ...MIN, body: "a".repeat(8000) })).not.toThrow();
  });

  it("эх сурвалж хорь хүртэл", () => {
    const url = "https://parliament.mn/a";
    expect(() => postInputSchema.parse({ ...MIN, sources: Array(20).fill(url) })).not.toThrow();
    expect(() => postInputSchema.parse({ ...MIN, sources: Array(21).fill(url) })).toThrow();
  });

  it("гарчиг хоосон байж болохгүй", () => {
    expect(() => postInputSchema.parse({ ...MIN, title: "   " })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, title: "" })).toThrow();
  });

  /** `javascript:` холбоос нь нийтлэлийн доор дарагдах товч болно */
  it("эх сурвалж нь http эсвэл https байх ёстой", () => {
    expect(() => postInputSchema.parse({ ...MIN, sources: ["javascript:alert(1)"] })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, sources: ["parliament.mn"] })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, sources: ["http://a.mn"] })).not.toThrow();
  });

  it("огноо нь YYYY-MM-DD", () => {
    expect(() => postInputSchema.parse({ ...MIN, date: "2026/11/27" })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, date: "27.11.2026" })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, date: "2026-13-01" })).toThrow();
  });

  it("хуулийн төслийн шат нь 0-4", () => {
    expect(() => postInputSchema.parse({ ...MIN, billStage: 5 })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, billStage: -1 })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, billStage: 4 })).not.toThrow();
  });

  it("санал хураалтын тоо сөрөг байж болохгүй", () => {
    expect(() => postInputSchema.parse({ ...MIN, votesYes: -1 })).toThrow();
  });

  it("сторины хугацаа нь artifact-ийн сонголтууд", () => {
    for (const d of [0, 1, 3, 7]) {
      expect(() => postInputSchema.parse({ ...MIN, storyDays: d })).not.toThrow();
    }
    expect(() => postInputSchema.parse({ ...MIN, storyDays: 2 })).toThrow();
  });

  it("шошго нь хэт олон биш", () => {
    expect(() => postInputSchema.parse({ ...MIN, tags: Array(21).fill("а") })).toThrow();
  });

  it("хамгийн бага оролт нь гарчиг ба огноо", () => {
    expect(() => postInputSchema.parse(MIN)).not.toThrow();
  });
});
