import { describe, it, expect } from "vitest";
import type { NewsRole } from "@nuul/db-news";
import { navFor, type NavItem } from "./studio-nav";
import type { Actor } from "./permissions";

const act = (role: NewsRole): Actor => ({ userId: "u1", role });
const hrefs = (role: NewsRole): string[] => navFor(act(role)).map((i: NavItem) => i.href);

/**
 * Хажуугийн цэс нь ЭРХИЙН ТОЛЬ: хүн юу хийж чадахгүй бол түүний холбоос
 * ч байхгүй. Товч нуух нь хамгаалалт биш (мутаци бүр өөрөө шалгана),
 * гэхдээ ажиллахгүй холбоосоор дүүрэн цэс нь хүнийг 403 руу хөтөлнө.
 */
describe("navFor", () => {
  it("шинжээч зөвхөн жагсаалт харна", () => {
    expect(hrefs("ANALYST")).toEqual(["/studio/news"]);
  });

  it("супер админ бүх холбоостой", () => {
    const h = hrefs("SUPER");
    expect(h).toContain("/studio/news");
    expect(h).toContain("/studio/news/new");
    expect(h).toContain("/studio/settings");
  });

  it("медиа редактор шинэ мэдээ үүсгэхгүй", () => {
    expect(hrefs("MEDIA")).not.toContain("/studio/news/new");
  });

  it("сэтгүүлч шинэ мэдээ үүсгэнэ, тохиргоо засахгүй", () => {
    expect(hrefs("REPORTER")).toContain("/studio/news/new");
    expect(hrefs("REPORTER")).not.toContain("/studio/settings");
  });

  /** admin.html-ийн `navSet` — зөвхөн super, chief, live */
  it("шууд дамжуулалтын оператор тохиргоотой, шинэ мэдээгүй", () => {
    expect(hrefs("LIVE")).toContain("/studio/settings");
    expect(hrefs("LIVE")).not.toContain("/studio/news/new");
  });

  it("жагсаалт нь ҮРГЭЛЖ байна — үүрэг бүр ядаж нэг хуудастай", () => {
    const roles: NewsRole[] = [
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
    for (const r of roles) {
      expect(hrefs(r)[0]).toBe("/studio/news");
      expect(navFor(act(r)).length).toBeGreaterThan(0);
    }
  });

  it("холбоос бүр монгол шошготой, хоосонгүй", () => {
    for (const item of navFor(act("SUPER"))) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.href.startsWith("/studio")).toBe(true);
    }
  });

  it("холбоос давхардахгүй", () => {
    const h = hrefs("SUPER");
    expect(new Set(h).size).toBe(h.length);
  });
});
