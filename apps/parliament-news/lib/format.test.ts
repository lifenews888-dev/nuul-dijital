import { describe, it, expect } from "vitest";
import {
  mnDate,
  mnShortDate,
  mnDateTime,
  readMinutes,
  excerpt,
} from "./format";

describe("mnDate", () => {
  it("монгол бичгээр бүтэн огноо", () => {
    expect(mnDate(new Date("2026-11-26T00:00:00Z"))).toBe("2026 оны 11 дүгээр сарын 26");
  });
  it("1-р сар нь «1 дүгээр»", () => {
    expect(mnDate(new Date("2027-01-01T00:00:00Z"))).toBe("2027 оны 1 дүгээр сарын 1");
  });

  // Эгшиг зохицол: дүгээр = {1,4,9,11}, дугаар = бусад
  it("2 дугаар", () => {
    expect(mnDate(new Date("2026-02-03T00:00:00Z"))).toBe("2026 оны 2 дугаар сарын 3");
  });
  it("7 дугаар", () => {
    expect(mnDate(new Date("2026-07-15T00:00:00Z"))).toBe("2026 оны 7 дугаар сарын 15");
  });
  it("9 дүгээр", () => {
    expect(mnDate(new Date("2026-09-09T00:00:00Z"))).toBe("2026 оны 9 дүгээр сарын 9");
  });
  it("12 дугаар", () => {
    expect(mnDate(new Date("2026-12-31T00:00:00Z"))).toBe("2026 оны 12 дугаар сарын 31");
  });

  // NewsPost.date нь @db.Date — Prisma түүнийг UTC шөнө дундаар буцаана.
  // Local getter хэрэглэвэл UTC-ээс барууны машин дээр өдөр нь нэгээр хоцорно.
  it("огнооны талбарыг UTC-ээр уншина, машины цагийн бүсээс хамаарахгүй", () => {
    expect(mnDate(new Date("2026-01-01T00:00:00Z"))).toBe("2026 оны 1 дүгээр сарын 1");
    expect(mnDate(new Date("2026-12-31T00:00:00Z"))).toBe("2026 оны 12 дугаар сарын 31");
  });
});

describe("mnShortDate", () => {
  it("сар.өдөр", () => {
    expect(mnShortDate(new Date("2026-11-26T00:00:00Z"))).toBe("11.26");
  });
  it("нэг оронтойг тэглэнэ", () => {
    expect(mnShortDate(new Date("2026-01-05T00:00:00Z"))).toBe("01.05");
  });
});

describe("mnDateTime", () => {
  // publishedAt нь бодит хором — уншигч Монголд байгаа тул УБ-ийн цагаар.
  // Монгол 2017-оос хойш DST хэрэглэхгүй: UTC+8 тогтмол.
  it("УБ-ийн цагаар сар.өдөр цаг:минут", () => {
    expect(mnDateTime(new Date("2026-11-26T06:30:00Z"))).toBe("11.26 14:30");
  });
  it("UTC-ийн шөнө дунд нь УБ-д дараагийн өдрийн 08:00", () => {
    expect(mnDateTime(new Date("2026-11-26T00:00:00Z"))).toBe("11.26 08:00");
  });
  it("UTC-ийн 20:00 нь УБ-д дараа өдрийн 04:00", () => {
    expect(mnDateTime(new Date("2026-11-26T20:00:00Z"))).toBe("11.27 04:00");
  });
});

describe("readMinutes", () => {
  it("200 үг → 1 минут", () => {
    expect(readMinutes(Array(200).fill("үг").join(" "))).toBe(1);
  });
  it("600 үг → 3 минут", () => {
    expect(readMinutes(Array(600).fill("үг").join(" "))).toBe(3);
  });
  it("хоосон бол 1", () => {
    expect(readMinutes(null)).toBe(1);
    expect(readMinutes("")).toBe(1);
  });
  it("зөвхөн зай бол 1", () => {
    expect(readMinutes("   \n\n  ")).toBe(1);
  });
});

describe("excerpt", () => {
  it("үгийн зааг дээр тасална", () => {
    expect(excerpt("Чуулганы нэгдсэн хуралдаан", 12)).toBe("Чуулганы…");
  });
  it("багтаж байвал хөндөхгүй", () => {
    expect(excerpt("Товч", 12)).toBe("Товч");
  });
  it("null → хоосон", () => {
    expect(excerpt(null, 10)).toBe("");
  });
  // metaDescription нь зайгүй урт биетэд үүнээс хамаарна
  it("нэг ч үг багтахгүй бол хязгаар дээр хүчээр тасална", () => {
    const out = excerpt("а".repeat(400), 155);
    expect(out.length).toBe(156);
    expect(out.endsWith("…")).toBe(true);
  });
});
