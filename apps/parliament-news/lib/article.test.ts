import { describe, it, expect } from "vitest";
import { resolveSlugTarget, paragraphs } from "./article";

describe("resolveSlugTarget", () => {
  it("мэдээ олдоогүй бол 404", () => {
    expect(resolveSlugTarget("baihgui", null)).toEqual({ kind: "notFound" });
  });

  it("гуйсан slug нь одоогийн slug — рендерлэнэ", () => {
    expect(resolveSlugTarget("tosov", { slug: "tosov" })).toEqual({ kind: "render" });
  });

  it("хуучин slug — одоогийн рүү шилжүүлнэ", () => {
    expect(resolveSlugTarget("huuchin", { slug: "shine" })).toEqual({
      kind: "redirect",
      to: "/news/shine",
    });
  });

  // Review Focus #2: A -> B -> A. "a" гэсэн redirect мөр үлдсэн, мэдээний slug
  // нь дахиад "a" болсон бол хуудас өөр дээрээ шилжиж тэнцвэргүй цикл үүснэ.
  it("slug нь хуучин утга руугаа буцсан ч өөр дээрээ шилжихгүй", () => {
    expect(resolveSlugTarget("a", { slug: "a" })).toEqual({ kind: "render" });
  });

  it("том/жижиг үсгийн ялгаа нь өөр slug — шилжүүлнэ", () => {
    expect(resolveSlugTarget("Tosov", { slug: "tosov" })).toEqual({
      kind: "redirect",
      to: "/news/tosov",
    });
  });
});

describe("paragraphs", () => {
  it("хоосон мөрөөр хуваана", () => {
    expect(paragraphs("Нэг\n\nХоёр")).toEqual(["Нэг", "Хоёр"]);
  });
  it("нэг хоосон мөр ч, хэд ч байсан адил", () => {
    expect(paragraphs("Нэг\n\n\n\nХоёр")).toEqual(["Нэг", "Хоёр"]);
  });
  it("зөвхөн зайтай хэсгийг гаргахгүй", () => {
    expect(paragraphs("Нэг\n\n   \n\nХоёр")).toEqual(["Нэг", "Хоёр"]);
  });
  it("null → хоосон массив", () => {
    expect(paragraphs(null)).toEqual([]);
  });
  it("хоосон мөр → хоосон массив", () => {
    expect(paragraphs("")).toEqual([]);
    expect(paragraphs("   \n\n  ")).toEqual([]);
  });
  it("нэг догол мөрийг бүтнээр нь үлдээнэ", () => {
    expect(paragraphs("Нэг мөр\nхоёр дахь мөр")).toEqual(["Нэг мөр\nхоёр дахь мөр"]);
  });
  it("эхлэл, төгсгөлийн зайг тайрна", () => {
    expect(paragraphs("\n\n  Нэг  \n\n")).toEqual(["Нэг"]);
  });
  it("\\r\\n мөр дамжилттай текст (Windows-аас хуулсан) ажиллана", () => {
    expect(paragraphs("Нэг\r\n\r\nХоёр")).toEqual(["Нэг", "Хоёр"]);
  });
});
