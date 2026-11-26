import { describe, it, expect } from "vitest";
import { tickerItems } from "./ticker";

const ads = [
  { text: "ЗАР A", url: "https://example.mn/a" },
  { text: "ЗАР B", url: null },
];
const titles = (n: number) => Array.from({ length: n }, (_, i) => `Мэдээ ${i}`);

describe("tickerItems", () => {
  it("зар байхгүй бол зөвхөн мэдээ", () => {
    const out = tickerItems(titles(5), []);
    expect(out).toHaveLength(5);
    expect(out.every((x) => x.kind === "news")).toBe(true);
  });

  it("гурав тутамд нэг зар — 3, 6, 9 дэх мэдээний дараа", () => {
    const out = tickerItems(titles(9), ads);
    const kinds = out.map((x) => x.kind);
    expect(kinds).toEqual([
      "news", "news", "news", "ad",
      "news", "news", "news", "ad",
      "news", "news", "news", "ad",
    ]);
  });

  it("зарууд ээлжилж эргэнэ", () => {
    const out = tickerItems(titles(9), ads);
    expect(out.filter((x) => x.kind === "ad").map((x) => x.text)).toEqual([
      "ЗАР A", "ЗАР B", "ЗАР A",
    ]);
  });

  it("зарын холбоос дамжина", () => {
    const out = tickerItems(titles(3), ads);
    const ad = out.find((x) => x.kind === "ad");
    expect(ad).toEqual({ kind: "ad", text: "ЗАР A", url: "https://example.mn/a" });
  });

  it("гуравхан мэдээгүй бол зар орохгүй", () => {
    expect(tickerItems(titles(2), ads).every((x) => x.kind === "news")).toBe(true);
  });

  it("мэдээгүй бол хоосон — зар ганцаараа гүйхгүй", () => {
    expect(tickerItems([], ads)).toEqual([]);
  });
});
