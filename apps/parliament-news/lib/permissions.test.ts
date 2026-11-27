import { describe, it, expect } from "vitest";
import type { NewsRole, NewsStatus } from "@nuul/db-news";
import {
  ROLE_LABELS,
  SECTIONS,
  ACTION_STATUS,
  FLOW,
  sectionsFor,
  canEditSection,
  canCreate,
  canDelete,
  canAct,
  canSetStatusManually,
  visibleStatuses,
  canEditSettings,
  type Actor,
  type PostRef,
  type WorkflowAction,
} from "./permissions";

const act = (role: NewsRole, userId = "u1"): Actor => ({ userId, role });
const post = (p: Partial<PostRef> = {}): PostRef => ({
  id: "p1",
  status: "DRAFT",
  authorId: "u1",
  ...p,
});

const ALL_ROLES: NewsRole[] = [
  "SUPER",
  "CHIEF",
  "REVIEWER",
  "REPORTER",
  "MEDIA",
  "LEGAL",
  "SOCIAL",
  "LIVE",
  "CONTRIBUTOR",
  "ANALYST",
];

const ALL_ACTIONS: WorkflowAction[] = ["submit", "approve", "return", "publish", "unpublish"];
const ALL_STATUSES: NewsStatus[] = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "RETURNED"];

describe("ROLE_LABELS", () => {
  /** admin.html:841-850-ийн ROLES — нэр, тайлбар яг хэвээр */
  it("artifact-ийн монгол нэрүүд", () => {
    expect(ROLE_LABELS.SUPER.name).toBe("Супер админ");
    expect(ROLE_LABELS.CHIEF.name).toBe("Ерөнхий редактор");
    expect(ROLE_LABELS.REVIEWER.name).toBe("Хянагч");
    expect(ROLE_LABELS.REPORTER.name).toBe("Сэтгүүлч");
    expect(ROLE_LABELS.MEDIA.name).toBe("Зураг, видео редактор");
    expect(ROLE_LABELS.LEGAL.name).toBe("Хуулийн мэдээний хариуцагч");
    expect(ROLE_LABELS.SOCIAL.name).toBe("Сошиал менежер");
    expect(ROLE_LABELS.LIVE.name).toBe("Шууд дамжуулалтын оператор");
    expect(ROLE_LABELS.CONTRIBUTOR.name).toBe("Зочин зохиогч");
    expect(ROLE_LABELS.ANALYST.name).toBe("Шинжээч");
  });

  it("үүрэг бүр тайлбартай", () => {
    for (const r of ALL_ROLES) expect(ROLE_LABELS[r].about.length).toBeGreaterThan(10);
  });

  it("хянагч нийтлэхгүй гэдгийг тайлбар нь хэлнэ", () => {
    expect(ROLE_LABELS.REVIEWER.about).toContain("Нийтлэхгүй");
  });
});

describe("SECTIONS", () => {
  it("artifact-ийн хүснэгтээр", () => {
    expect(SECTIONS.SUPER).toEqual(["basic", "photos", "video", "bill", "src", "look", "pub"]);
    expect(SECTIONS.CHIEF).toEqual(["basic", "photos", "video", "bill", "src", "look", "pub"]);
    expect(SECTIONS.REVIEWER).toEqual(["basic", "photos", "video", "bill", "src", "look", "pub"]);
    expect(SECTIONS.REPORTER).toEqual(["basic", "photos", "video", "bill", "src", "look"]);
    expect(SECTIONS.CONTRIBUTOR).toEqual(["basic", "src", "look"]);
    expect(SECTIONS.MEDIA).toEqual(["photos", "video"]);
    expect(SECTIONS.LEGAL).toEqual(["bill", "src"]);
    expect(SECTIONS.SOCIAL).toEqual(["pub"]);
    expect(SECTIONS.LIVE).toEqual([]);
    expect(SECTIONS.ANALYST).toEqual([]);
  });
});

describe("sectionsFor", () => {
  it("сэтгүүлч зөвхөн өөрийн ноорог, буцаасныг засна", () => {
    expect(sectionsFor(act("REPORTER"), post({ status: "DRAFT" }))).toHaveLength(6);
    expect(sectionsFor(act("REPORTER"), post({ status: "RETURNED" }))).toHaveLength(6);
    expect(sectionsFor(act("REPORTER"), post({ status: "REVIEW" }))).toEqual([]);
    expect(sectionsFor(act("REPORTER"), post({ authorId: "u2" }))).toEqual([]);
  });

  it("зочин зохиогч ч мөн адил, гэхдээ гурван хэсэг", () => {
    expect(sectionsFor(act("CONTRIBUTOR"), post({ status: "DRAFT" }))).toEqual([
      "basic",
      "src",
      "look",
    ]);
    expect(sectionsFor(act("CONTRIBUTOR"), post({ authorId: "u2" }))).toEqual([]);
  });

  it("шинэ мэдээ (id null) нь өөрийнх гэж тооцогдоно", () => {
    expect(sectionsFor(act("REPORTER"), post({ id: null, authorId: null }))).toHaveLength(6);
  });

  it("хянагч зөвхөн хянагдаж буй, батлагдсаныг — шинийг мөн", () => {
    expect(sectionsFor(act("REVIEWER"), post({ status: "REVIEW" }))).toHaveLength(7);
    expect(sectionsFor(act("REVIEWER"), post({ status: "APPROVED" }))).toHaveLength(7);
    expect(sectionsFor(act("REVIEWER"), post({ status: "DRAFT" }))).toEqual([]);
    expect(sectionsFor(act("REVIEWER"), post({ id: null, status: "DRAFT" }))).toHaveLength(7);
  });

  it("медиа редактор нийтлэгдсэн мэдээнд хүрэхгүй", () => {
    expect(sectionsFor(act("MEDIA"), post({ status: "APPROVED" }))).toEqual(["photos", "video"]);
    expect(sectionsFor(act("MEDIA"), post({ status: "PUBLISHED" }))).toEqual([]);
  });

  it("ерөнхий редактор бүх мэдээг засна", () => {
    expect(sectionsFor(act("CHIEF"), post({ authorId: "u2", status: "PUBLISHED" }))).toHaveLength(
      7,
    );
  });

  it("шинжээч юу ч засахгүй", () => {
    expect(sectionsFor(act("ANALYST"), post())).toEqual([]);
  });

  it("хуулбарыг өгнө — дуудагч хүснэгтийг хөндөхгүй", () => {
    const got = sectionsFor(act("SUPER"), post());
    got.pop();
    expect(SECTIONS.SUPER).toHaveLength(7);
  });
});

describe("canEditSection", () => {
  it("хуулийн хариуцагч зөвхөн хууль, эх сурвалжийг", () => {
    expect(canEditSection(act("LEGAL"), post(), "bill")).toBe(true);
    expect(canEditSection(act("LEGAL"), post(), "src")).toBe(true);
    expect(canEditSection(act("LEGAL"), post(), "basic")).toBe(false);
  });

  it("сэтгүүлч бусдын мэдээний ямар ч хэсгийг засахгүй", () => {
    expect(canEditSection(act("REPORTER"), post({ authorId: "u2" }), "basic")).toBe(false);
  });
});

describe("canAct", () => {
  it("submit: ноорог, буцаасан дээр, өөрийнх эсвэл ахлах", () => {
    expect(canAct(act("REPORTER"), post({ status: "DRAFT" }), "submit")).toBe(true);
    expect(canAct(act("REPORTER"), post({ status: "RETURNED" }), "submit")).toBe(true);
    expect(canAct(act("REPORTER"), post({ status: "REVIEW" }), "submit")).toBe(false);
    expect(canAct(act("REPORTER"), post({ authorId: "u2" }), "submit")).toBe(false);
    expect(canAct(act("CHIEF"), post({ authorId: "u2" }), "submit")).toBe(true);
    expect(canAct(act("MEDIA"), post(), "submit")).toBe(false);
  });

  it("approve: зөвхөн хянагдаж буйгаас, хянагч дээш", () => {
    expect(canAct(act("REVIEWER"), post({ status: "REVIEW" }), "approve")).toBe(true);
    expect(canAct(act("CHIEF"), post({ status: "REVIEW" }), "approve")).toBe(true);
    expect(canAct(act("REVIEWER"), post({ status: "DRAFT" }), "approve")).toBe(false);
    expect(canAct(act("REVIEWER"), post({ status: "APPROVED" }), "approve")).toBe(false);
    expect(canAct(act("REPORTER"), post({ status: "REVIEW" }), "approve")).toBe(false);
  });

  it("return: хянагдаж буй ба батлагдсанаас", () => {
    expect(canAct(act("REVIEWER"), post({ status: "REVIEW" }), "return")).toBe(true);
    expect(canAct(act("REVIEWER"), post({ status: "APPROVED" }), "return")).toBe(true);
    expect(canAct(act("REVIEWER"), post({ status: "PUBLISHED" }), "return")).toBe(false);
    expect(canAct(act("REVIEWER"), post({ status: "DRAFT" }), "return")).toBe(false);
  });

  it("publish: зөвхөн ахлах, нийтлэгдээгүй бол", () => {
    expect(canAct(act("CHIEF"), post({ status: "APPROVED" }), "publish")).toBe(true);
    expect(canAct(act("CHIEF"), post({ status: "DRAFT" }), "publish")).toBe(true);
    expect(canAct(act("SUPER"), post({ status: "REVIEW" }), "publish")).toBe(true);
    expect(canAct(act("CHIEF"), post({ status: "PUBLISHED" }), "publish")).toBe(false);
    expect(canAct(act("REVIEWER"), post({ status: "APPROVED" }), "publish")).toBe(false);
  });

  it("unpublish: зөвхөн нийтлэгдсэнээс, ахлах", () => {
    expect(canAct(act("CHIEF"), post({ status: "PUBLISHED" }), "unpublish")).toBe(true);
    expect(canAct(act("SUPER"), post({ status: "PUBLISHED" }), "unpublish")).toBe(true);
    expect(canAct(act("CHIEF"), post({ status: "DRAFT" }), "unpublish")).toBe(false);
    expect(canAct(act("REVIEWER"), post({ status: "PUBLISHED" }), "unpublish")).toBe(false);
  });

  it("бүх үйлдэл, бүх төлөв — шинжээч, оператор, сошиал, хуульч юу ч хийхгүй", () => {
    for (const a of ALL_ACTIONS) {
      for (const st of ALL_STATUSES) {
        expect(canAct(act("ANALYST"), post({ status: st }), a)).toBe(false);
        expect(canAct(act("LIVE"), post({ status: st }), a)).toBe(false);
        expect(canAct(act("SOCIAL"), post({ status: st }), a)).toBe(false);
        expect(canAct(act("LEGAL"), post({ status: st }), a)).toBe(false);
      }
    }
  });

  it("хадгалаагүй шинэ мэдээг илгээхгүй — өмнө нь хадгална", () => {
    expect(canAct(act("REPORTER"), post({ id: null, authorId: null }), "submit")).toBe(false);
  });
});

describe("canDelete / canCreate", () => {
  it("устгах: ахлах бүгдийг, сэтгүүлч зөвхөн өөрийн хадгалсан ноорог", () => {
    expect(canDelete(act("CHIEF"), post({ authorId: "u2", status: "PUBLISHED" }))).toBe(true);
    expect(canDelete(act("SUPER"), post({ authorId: "u2", status: "PUBLISHED" }))).toBe(true);
    expect(canDelete(act("REPORTER"), post({ status: "DRAFT" }))).toBe(true);
    expect(canDelete(act("REPORTER"), post({ status: "RETURNED" }))).toBe(true);
    expect(canDelete(act("REPORTER"), post({ status: "REVIEW" }))).toBe(false);
    expect(canDelete(act("REPORTER"), post({ authorId: "u2" }))).toBe(false);
    expect(canDelete(act("REPORTER"), post({ id: null }))).toBe(false);
    expect(canDelete(act("REVIEWER"), post())).toBe(false);
  });

  it("үүсгэх: таван үүрэг", () => {
    for (const r of ["SUPER", "CHIEF", "REVIEWER", "REPORTER", "CONTRIBUTOR"] as NewsRole[]) {
      expect(canCreate(act(r))).toBe(true);
    }
    for (const r of ["MEDIA", "LEGAL", "SOCIAL", "LIVE", "ANALYST"] as NewsRole[]) {
      expect(canCreate(act(r))).toBe(false);
    }
  });
});

describe("ACTION_STATUS", () => {
  it("artifact-ийн NS хүснэгт", () => {
    expect(ACTION_STATUS).toEqual({
      submit: "REVIEW",
      approve: "APPROVED",
      return: "RETURNED",
      publish: "PUBLISHED",
      unpublish: "DRAFT",
    });
  });
});

describe("FLOW", () => {
  it("artifact-ийн дөрвөн шат — буцаасан нь шат биш", () => {
    expect(FLOW.map((f) => f.status)).toEqual(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED"]);
    expect(FLOW.map((f) => f.label)).toEqual([
      "Ноорог",
      "Хянагдаж буй",
      "Батлагдсан",
      "Нийтлэгдсэн",
    ]);
  });
});

describe("canSetStatusManually", () => {
  it("зөвхөн супер админ", () => {
    expect(canSetStatusManually(act("SUPER"))).toBe(true);
    expect(canSetStatusManually(act("CHIEF"))).toBe(false);
    expect(canSetStatusManually(act("REVIEWER"))).toBe(false);
  });
});

describe("visibleStatuses", () => {
  it("медиа редактор нийтлэгдсэнийг харахгүй", () => {
    expect(visibleStatuses(act("MEDIA"))).not.toContain("PUBLISHED");
  });

  it("супер админ бүгдийг харна", () => {
    expect(visibleStatuses(act("SUPER"))).toHaveLength(5);
  });

  it("шинжээч зөвхөн нийтлэгдсэнийг", () => {
    expect(visibleStatuses(act("ANALYST"))).toEqual(["PUBLISHED"]);
  });
});

describe("canEditSettings", () => {
  it("зөвхөн super, chief, live — admin.html-ийн navSet", () => {
    expect(canEditSettings(act("SUPER"))).toBe(true);
    expect(canEditSettings(act("CHIEF"))).toBe(true);
    expect(canEditSettings(act("LIVE"))).toBe(true);
    expect(canEditSettings(act("REPORTER"))).toBe(false);
    expect(canEditSettings(act("ANALYST"))).toBe(false);
  });
});
