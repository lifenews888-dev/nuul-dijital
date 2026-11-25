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
