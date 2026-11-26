import { describe, it, expect } from "vitest";
import { publishedWhere, searchTerm, escapeLike, SEARCH_MAX } from "./posts";

describe("publishedWhere", () => {
  it("зөвхөн PUBLISHED, зөвхөн publishedAt нь өнгөрсөн", () => {
    const now = new Date("2026-11-26T10:00:00Z");
    expect(publishedWhere(now)).toEqual({
      status: "PUBLISHED",
      publishedAt: { not: null, lte: now },
    });
  });

  it("now өгөөгүй бол одоогийн цаг", () => {
    const w = publishedWhere();
    expect(w.publishedAt.lte.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("дуудалт бүр шинэ объект — дуудагч өөрчилж нөгөөг нь эвдэхгүй", () => {
    const a = publishedWhere();
    const b = publishedWhere();
    expect(a).not.toBe(b);
    expect(a.publishedAt).not.toBe(b.publishedAt);
  });
});

describe("searchTerm", () => {
  it("зай тайрна", () => {
    expect(searchTerm("  хууль  ")).toBe("хууль");
  });

  it("хоосон, зөвхөн зай, undefined → null", () => {
    expect(searchTerm("")).toBeNull();
    expect(searchTerm("   ")).toBeNull();
    expect(searchTerm(undefined)).toBeNull();
  });

  it("хязгаараас урт → null", () => {
    expect(searchTerm("а".repeat(SEARCH_MAX + 1))).toBeNull();
    expect(searchTerm("а".repeat(SEARCH_MAX))).not.toBeNull();
  });

  it("хязгаар нь 200", () => {
    expect(SEARCH_MAX).toBe(200);
  });

  it("кирилл хөндөгдөхгүй", () => {
    expect(searchTerm("хуулийн төсөл")).toBe("хуулийн төсөл");
  });

  it("percent-encoded оролтыг decode хийхгүй — route түүнийг хийнэ", () => {
    expect(searchTerm("%20")).toBe("%20");
  });

  it("тайрсны дараа хязгаарт багтвал зөвшөөрнө", () => {
    expect(searchTerm("  " + "а".repeat(SEARCH_MAX) + "  ")).toBe("а".repeat(SEARCH_MAX));
  });
});

/**
 * Prisma-ийн `contains` нь LIKE/ILIKE болж хөрвөхдөө `%` ба `_`-г зугтаадаггүй.
 * Тиймээс `?q=%` нь БҮХ мэдээг буцаана — «хоосон хайлт бүх мэдээг буцаахгүй»
 * гэсэн баталгааг өөр хаалгаар давж, мөр бүр дээр ILIKE хийх үнэгүй ачаалал
 * болно. Хайх үгийг харуулахдаа эх хэвээр, query-д оруулахдаа зугтаасан
 * хэлбэрээр нь — тиймээс `searchTerm`-ээс тусдаа функц.
 */
describe("escapeLike", () => {
  it("% ба _ нь энгийн тэмдэгт болно", () => {
    expect(escapeLike("%")).toBe("\\%");
    expect(escapeLike("_")).toBe("\\_");
    expect(escapeLike("50%")).toBe("50\\%");
    expect(escapeLike("%%%")).toBe("\\%\\%\\%");
  });

  it("backslash-ийг ЭХЛЭЭД зугтаана — эс бөгөөс давхар зугтаана", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
    expect(escapeLike("\\%")).toBe("\\\\\\%");
  });

  it("энгийн үгийг хөндөхгүй", () => {
    expect(escapeLike("төсөв")).toBe("төсөв");
    expect(escapeLike("хуулийн төсөл")).toBe("хуулийн төсөл");
  });

  it("хоосон мөр", () => {
    expect(escapeLike("")).toBe("");
  });
});
