import { describe, it, expect } from "vitest";
import {
  FZ_MIN,
  FZ_MAX,
  FZ_STEP,
  clampFz,
  shareLinks,
  relatedScore,
  commentAgo,
  stageState,
  stageNote,
  voteShare,
  runningHeader,
} from "./reading";

describe("үсгийн хэмжээ", () => {
  it("artifact-ийн хязгаар: .85 – 1.4, .1 алхам", () => {
    expect([FZ_MIN, FZ_MAX, FZ_STEP]).toEqual([0.85, 1.4, 0.1]);
  });

  it("хязгаараас гарахгүй", () => {
    expect(clampFz(0.1)).toBe(FZ_MIN);
    expect(clampFz(9)).toBe(FZ_MAX);
  });

  it("хоёр оронтой болгож бөөрөнхийлнө — .1 нэмэх нь 1.2000000000000002 өгдөг", () => {
    expect(clampFz(1.1 + 0.1)).toBe(1.2);
  });

  it("тоо биш, NaN нь 1", () => {
    expect(clampFz(Number.NaN)).toBe(1);
  });
});

describe("shareLinks", () => {
  const L = shareLinks("https://parlamentnews.mn/news/a b", "Гарчиг & тэмдэг");

  it("гурван сүлжээ", () => {
    expect(Object.keys(L).sort()).toEqual(["facebook", "telegram", "x"]);
  });

  it("хаяг, гарчгийг кодчилно — & нь параметр тасалдуулахгүй", () => {
    expect(L.x).toContain(encodeURIComponent("Гарчиг & тэмдэг"));
    expect(L.facebook).toContain(encodeURIComponent("https://parlamentnews.mn/news/a b"));
    expect(L.x).not.toContain("& тэмдэг");
  });

  it("бүгд https", () => {
    for (const u of Object.values(L)) expect(u.startsWith("https://")).toBe(true);
  });
});

describe("relatedScore — artifact-ийн эрэмбэ", () => {
  const now = new Date("2026-11-27T00:00:00Z");
  const base = { categorySlug: "huuli", hasBill: true, featured: false, date: now };

  it("ижил ангилал хамгийн хүчтэй", () => {
    const same = relatedScore(base, { ...base, featured: false }, now);
    const other = relatedScore(base, { ...base, categorySlug: "tosov" }, now);
    expect(same - other).toBeCloseTo(3, 5);
  });

  it("хоёулаа хуулийн төсөлтэй бол нэг оноо", () => {
    const withBill = relatedScore(base, base, now);
    const without = relatedScore(base, { ...base, hasBill: false }, now);
    expect(withBill - without).toBeCloseTo(1, 5);
  });

  it("онцлох нэг оноо", () => {
    expect(
      relatedScore(base, { ...base, featured: true }, now) - relatedScore(base, base, now),
    ).toBeCloseTo(1, 5);
  });

  it("огноо хол байх тусам оноо буурна", () => {
    const near = relatedScore(base, { ...base, date: new Date("2026-11-20T00:00:00Z") }, now);
    const far = relatedScore(base, { ...base, date: new Date("2025-01-01T00:00:00Z") }, now);
    expect(near).toBeGreaterThan(far);
  });
});

describe("commentAgo", () => {
  const now = new Date("2026-11-27T12:00:00Z");

  it("нэг минутаас бага", () => {
    expect(commentAgo(new Date("2026-11-27T11:59:40Z"), now)).toBe("дөнгөж сая");
  });

  it("минут", () => {
    expect(commentAgo(new Date("2026-11-27T11:30:00Z"), now)).toBe("30 мин өмнө");
  });

  it("цаг", () => {
    expect(commentAgo(new Date("2026-11-27T06:00:00Z"), now)).toBe("6 цагийн өмнө");
  });

  it("нэг хоногоос хойш огноо", () => {
    expect(commentAgo(new Date("2026-11-20T06:00:00Z"), now)).toBe("2026.11.20");
  });
});

describe("хуулийн шат", () => {
  it("өмнөх нь дууссан, одоогийнх нь одоогийн, дараагийнх нь хүлээгдэж буй", () => {
    expect(stageState(0, 2)).toBe("Дууссан");
    expect(stageState(2, 2)).toBe("Одоогийн шат");
    expect(stageState(4, 2)).toBe("Хүлээгдэж буй");
  });

  it("тэмдэглэлгүй ирээдүйн шат ба өнгөрсөн шат өөр өөр үг", () => {
    expect(stageNote(4, 2, null)).toBe("Энэ шат хараахан эхлээгүй байна.");
    expect(stageNote(1, 2, null)).toBe("Энэ шатны дэлгэрэнгүй мэдээлэл хараахан ороогүй байна.");
  });

  it("тэмдэглэл байвал түүнийг", () => {
    expect(stageNote(1, 2, "Ажлын хэсэг байгуулав")).toBe("Ажлын хэсэг байгуулав");
  });
});

describe("voteShare", () => {
  it("хувь ба дэмжлэг", () => {
    expect(voteShare(71, 9)).toEqual({ yesPct: 88.75, noPct: 11.25, support: 89 });
  });

  it("санал огт байхгүй бол тэглэхээс сэргийлж 1-ээр хуваана", () => {
    expect(voteShare(0, 0)).toEqual({ yesPct: 0, noPct: 0, support: 0 });
  });
});

describe("runningHeader", () => {
  it("PARLIAMENT NEWS · АНГИЛАЛ", () => {
    expect(runningHeader("Хуулийн мэдээ")).toBe("PARLIAMENT NEWS · ХУУЛИЙН МЭДЭЭ");
  });
});
