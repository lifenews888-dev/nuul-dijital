import { describe, it, expect } from "vitest";
import {
  canCreate,
  editableSections,
  visibleStatuses,
  canDelete,
  canTransition,
  canEditSettings,
  editableSectionsFor,
} from "./permissions";

describe("гишүүн биш хэрэглэгч", () => {
  it("юу ч хийхгүй", () => {
    expect(canCreate(null)).toBe(false);
    expect(editableSections(null)).toEqual([]);
    expect(visibleStatuses(null)).toEqual([]);
    expect(canEditSettings(null)).toBe(false);
    expect(canTransition(null, "DRAFT", "PUBLISHED")).toBe(false);
    expect(canDelete(null, { authorId: "u1", status: "DRAFT" }, "u1")).toBe(false);
  });
});

describe("editableSections", () => {
  it("эрх бүрийн хэсгүүд (SECS)", () => {
    expect(editableSections("CHIEF")).toEqual(["basic", "photos", "video", "bill", "src", "look", "pub"]);
    expect(editableSections("REPORTER")).toEqual(["basic", "photos", "video", "bill", "src", "look"]);
    expect(editableSections("CONTRIBUTOR")).toEqual(["basic", "src", "look"]);
    expect(editableSections("MEDIA")).toEqual(["photos", "video"]);
    expect(editableSections("LEGAL")).toEqual(["bill", "src"]);
    expect(editableSections("SOCIAL")).toEqual(["pub"]);
    expect(editableSections("LIVE")).toEqual([]);
    expect(editableSections("ANALYST")).toEqual([]);
  });
});

describe("visibleStatuses", () => {
  it("медиа редактор нийтлэгдсэнийг харахгүй", () => {
    expect(visibleStatuses("MEDIA")).not.toContain("PUBLISHED");
  });
  it("супер админ бүгдийг харна", () => {
    expect(visibleStatuses("SUPER")).toHaveLength(5);
  });
});

describe("canEditSettings", () => {
  it("зөвхөн super, chief, live", () => {
    expect((["SUPER", "CHIEF", "LIVE"] as const).every((r) => canEditSettings(r))).toBe(true);
    expect(canEditSettings("REVIEWER")).toBe(false);
  });
});

describe("canDelete", () => {
  const own = { authorId: "u1", status: "DRAFT" as const };
  it("сэтгүүлч өөрийн ноорогоо устгана", () => {
    expect(canDelete("REPORTER", own, "u1")).toBe(true);
  });
  it("бусдын мэдээг устгахгүй", () => {
    expect(canDelete("REPORTER", own, "u2")).toBe(false);
  });
  it("хянуулахаар илгээснийг устгахгүй", () => {
    expect(canDelete("REPORTER", { authorId: "u1", status: "REVIEW" }, "u1")).toBe(false);
  });
  it("ерөнхий редактор бүгдийг устгана", () => {
    expect(canDelete("CHIEF", { authorId: "u9", status: "PUBLISHED" }, "u1")).toBe(true);
  });
});

describe("canTransition", () => {
  it("сэтгүүлч шууд нийтлэхгүй", () => {
    expect(canTransition("REPORTER", "DRAFT", "PUBLISHED")).toBe(false);
    expect(canTransition("REPORTER", "DRAFT", "REVIEW")).toBe(true);
  });
  it("хянагч батална, нийтлэхгүй", () => {
    expect(canTransition("REVIEWER", "REVIEW", "APPROVED")).toBe(true);
    expect(canTransition("REVIEWER", "REVIEW", "RETURNED")).toBe(true);
    expect(canTransition("REVIEWER", "APPROVED", "PUBLISHED")).toBe(false);
  });
  it("ерөнхий редактор нийтэлж, буулгана", () => {
    expect(canTransition("CHIEF", "APPROVED", "PUBLISHED")).toBe(true);
    expect(canTransition("CHIEF", "PUBLISHED", "DRAFT")).toBe(true);
  });
  it("шинжээч юу ч солихгүй", () => {
    expect(canTransition("ANALYST", "DRAFT", "REVIEW")).toBe(false);
  });
});

describe("editableSectionsFor (secsFor — эрх + төлөв + эзэмшил)", () => {
  const REPORTER_SECTIONS = ["basic", "photos", "video", "bill", "src", "look"];

  it("сэтгүүлч зөвхөн өөрийн ноорог, буцаасан мэдээг засна", () => {
    expect(editableSectionsFor("REPORTER", { authorId: "u1", status: "DRAFT" }, "u1"))
      .toEqual(REPORTER_SECTIONS);
    expect(editableSectionsFor("REPORTER", { authorId: "u1", status: "RETURNED" }, "u1"))
      .toEqual(REPORTER_SECTIONS);
    expect(editableSectionsFor("REPORTER", { authorId: "u1", status: "REVIEW" }, "u1"))
      .toEqual([]);
    expect(editableSectionsFor("REPORTER", { authorId: "u2", status: "DRAFT" }, "u1"))
      .toEqual([]);
  });

  it("хянагч зөвхөн хянагдаж буй ба батлагдсаныг засна", () => {
    expect(editableSectionsFor("REVIEWER", { authorId: "u2", status: "REVIEW" }, "u1").length)
      .toBe(7);
    expect(editableSectionsFor("REVIEWER", { authorId: "u2", status: "DRAFT" }, "u1"))
      .toEqual([]);
    expect(editableSectionsFor("REVIEWER", { authorId: null, status: "DRAFT", isNew: true }, "u1").length)
      .toBe(7);
  });

  it("медиа редактор нийтлэгдсэнд хүрэхгүй", () => {
    expect(editableSectionsFor("MEDIA", { authorId: "u2", status: "DRAFT" }, "u1"))
      .toEqual(["photos", "video"]);
    expect(editableSectionsFor("MEDIA", { authorId: "u2", status: "PUBLISHED" }, "u1"))
      .toEqual([]);
  });

  it("ерөнхий редактор бүх мэдээг засна", () => {
    expect(editableSectionsFor("CHIEF", { authorId: "u9", status: "PUBLISHED" }, "u1").length)
      .toBe(7);
  });

  it("гишүүн биш юу ч засахгүй", () => {
    expect(editableSectionsFor(null, { authorId: "u1", status: "DRAFT" }, "u1")).toEqual([]);
  });
});
