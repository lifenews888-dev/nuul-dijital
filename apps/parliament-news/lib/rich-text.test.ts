import { describe, it, expect } from "vitest";
import { parseRich, type Block } from "./rich-text";

const first = (src: string): Block => parseRich(src)[0];
const text = (b: Block) => ("spans" in b ? b.spans.map((s) => s.text).join("") : "");

describe("блокийн төрөл", () => {
  it("## гарчиг нь h3 блок", () => {
    const b = first("## Төсвийн хэлэлцүүлэг");
    expect(b.kind).toBe("h3");
    expect(text(b)).toBe("Төсвийн хэлэлцүүлэг");
  });

  it("> эхэлсэн мөр нь ишлэл", () => {
    expect(first("> Хууль батлагдлаа").kind).toBe("quote");
  });

  it(">> эхэлсэн мөр нь ОНЦЛОХ ишлэл", () => {
    const b = first(">> Энэ бол гол санаа");
    expect(b.kind).toBe("pull");
    expect(text(b)).toBe("Энэ бол гол санаа");
  });

  it("- эхэлсэн дараалсан мөрүүд нэг жагсаалт болно", () => {
    const b = parseRich("- Нэг\n- Хоёр\n- Гурав")[0];
    expect(b.kind).toBe("list");
    expect(b.kind === "list" && b.items.length).toBe(3);
  });

  it("энгийн мөр нь догол мөр", () => {
    expect(first("Энгийн текст").kind).toBe("p");
  });

  it("хоосон мөр нь блокийн заагч", () => {
    expect(parseRich("Нэг\n\nХоёр")).toHaveLength(2);
  });

  it("хоосон текст нь хоосон массив", () => {
    expect(parseRich("")).toEqual([]);
    expect(parseRich(null)).toEqual([]);
  });
});

describe("мөрийн доторх тэмдэглэгээ", () => {
  it("**тод** ба *налуу*", () => {
    const b = first("Энэ **тод** ба *налуу* үг");
    if (!("spans" in b)) throw new Error("span-тай блок биш");
    expect(b.spans.find((s) => s.bold)?.text).toBe("тод");
    expect(b.spans.find((s) => s.italic)?.text).toBe("налуу");
  });

  it("[текст](https://…) нь холбоос", () => {
    const b = first("Эх сурвалж [УИХ](https://parliament.mn) дээр");
    if (!("spans" in b)) throw new Error("span-тай блок биш");
    const link = b.spans.find((s) => s.href);
    expect(link?.href).toBe("https://parliament.mn");
    expect(link?.text).toBe("УИХ");
  });

  it("https биш холбоосыг ТЕКСТ болгоно", () => {
    const b = first("[дар](javascript:alert(1))");
    if (!("spans" in b)) throw new Error("span-тай блок биш");
    expect(b.spans.some((s) => s.href)).toBe(false);
    expect(text(b)).toContain("javascript:alert(1)");
  });

  it("http (найдваргүй) холбоос ч текст", () => {
    const b = first("[дар](http://a.mn)");
    if (!("spans" in b)) throw new Error("span-тай блок биш");
    expect(b.spans.some((s) => s.href)).toBe(false);
  });
});

/**
 * Зургийн хост нь `lib/image-hosts.js`-ийн цагаан жагсаалтаар шалгагдана —
 * одоогоор ЗӨВХӨН Vercel Blob. Гадны хаяг нь блок үүсгэхгүй: `next/image`
 * production-д 400 буцаах тул хоосон нүх үлдэхээс огт зурахгүй нь дээр.
 */
describe("медиа блок", () => {
  it("[[img:…|тайлбар]] нь зургийн блок", () => {
    const b = first("[[img:https://pn.public.blob.vercel-storage.com/a.jpg|Чуулганы танхим]]");
    expect(b.kind).toBe("img");
    expect(b.kind === "img" && b.caption).toBe("Чуулганы танхим");
  });

  it("тайлбаргүй зураг", () => {
    const b = first("[[img:https://pn.public.blob.vercel-storage.com/a.jpg]]");
    expect(b.kind === "img" && b.caption).toBeNull();
  });

  it("зөвшөөрөгдөөгүй хостын зураг нь блок үүсгэхгүй", () => {
    expect(parseRich("[[img:https://evil.mn/a.jpg]]")).toHaveLength(0);
  });

  it("[[embed:…]] нь шигтгээ", () => {
    const b = first("[[embed:https://x.com/a/status/1]]");
    expect(b.kind).toBe("embed");
    expect(b.kind === "embed" && b.url).toBe("https://x.com/a/status/1");
  });

  it("https биш шигтгээ блок үүсгэхгүй", () => {
    expect(parseRich("[[embed:javascript:alert(1)]]")).toHaveLength(0);
  });
});

describe("аюулгүй байдал", () => {
  it("HTML таг нь ТЕКСТ — ажиллах зам байхгүй", () => {
    const b = first("<script>alert(1)</script>");
    expect(b.kind).toBe("p");
    expect(text(b)).toBe("<script>alert(1)</script>");
  });

  it("зургийн тайлбар дахь хашилт нь текст хэвээр", () => {
    const b = first(`[[img:https://pn.public.blob.vercel-storage.com/a.jpg|"><img onerror=x>]]`);
    expect(b.kind === "img" && b.caption).toBe(`"><img onerror=x>`);
  });

  it("нэг оролтод нэг л гаргалт — тогтвортой", () => {
    const src = "## Гарчиг\n\n**тод** текст";
    expect(JSON.stringify(parseRich(src))).toBe(JSON.stringify(parseRich(src)));
  });
});
