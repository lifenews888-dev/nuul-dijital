import { describe, it, expect } from "vitest";
import { headerSchema, footerSchema, weatherSchema, feedSchema } from "./settings";

describe("headerSchema", () => {
  it("логоны байрлал, цэс, хэмжээг хязгаарлана", () => {
    expect(headerSchema.parse({})).toEqual({ pos: "left", size: 30, tagline: "", menu: "inline" });
    expect(headerSchema.parse({ size: 999 }).size).toBe(56);
    expect(headerSchema.parse({ size: 1 }).size).toBe(20);
    expect(() => headerSchema.parse({ pos: "top" })).toThrow();
    expect(() => headerSchema.parse({ menu: "mega" })).toThrow();
  });
});

describe("footerSchema", () => {
  it("10 талбартай, сошиал холбоос https байх", () => {
    const f = footerSchema.parse({ addr: "УБ", fb: "facebook.com/x" });
    expect(Object.keys(f).sort()).toEqual([
      "about", "addr", "email", "fb", "ig", "phone", "policy", "sales", "x", "yt",
    ]);
    expect(f.fb).toBe("https://facebook.com/x");
    expect(footerSchema.parse({ fb: "javascript:alert(1)" }).fb).toBe("");
  });

  // admin.html: ft_about нь maxlength=1500, ft_policy нь 2000 (textarea),
  // addr 160, phone 40, email 80, sales 80 (index.html-ийн sv() дуудлага).
  // Бүгдийг нэг хэмжээгээр хязгаарлавал «Бидний тухай» текст схемд багтахгүй.
  it("талбар бүрийн урт artifact-ийнхтай тохирно", () => {
    const long = (n: number) => "а".repeat(n);

    expect(footerSchema.parse({ about: long(1500) }).about.length).toBe(1500);
    expect(() => footerSchema.parse({ about: long(1501) })).toThrow();

    expect(footerSchema.parse({ policy: long(2000) }).policy.length).toBe(2000);
    expect(() => footerSchema.parse({ policy: long(2001) })).toThrow();

    expect(footerSchema.parse({ addr: long(160) }).addr.length).toBe(160);
    expect(() => footerSchema.parse({ addr: long(161) })).toThrow();

    expect(footerSchema.parse({ phone: long(40) }).phone.length).toBe(40);
    expect(() => footerSchema.parse({ phone: long(41) })).toThrow();

    expect(footerSchema.parse({ email: long(80) }).email.length).toBe(80);
    expect(() => footerSchema.parse({ email: long(81) })).toThrow();

    expect(footerSchema.parse({ sales: long(80) }).sales.length).toBe(80);
    expect(() => footerSchema.parse({ sales: long(81) })).toThrow();
  });
});

describe("weatherSchema", () => {
  it("null зөвшөөрнө, хотын нэр default", () => {
    expect(weatherSchema.parse(null)).toBeNull();
    expect(weatherSchema.parse({ t: -18 })).toEqual({ city: "Улаанбаатар", t: -18, icon: "sun", text: "" });
  });
});

describe("feedSchema", () => {
  it("rss default нь нээлттэй, fxApi https байх", () => {
    expect(feedSchema.parse({})).toEqual({ rss: true, fxSource: "", fxApi: "" });
    expect(feedSchema.parse({ fxApi: "http://x.mn" }).fxApi).toBe("");
  });
});
