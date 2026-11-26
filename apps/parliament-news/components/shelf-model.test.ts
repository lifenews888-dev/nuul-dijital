import { describe, it, expect } from "vitest";
import { shelfBooks, SHELF_FIRST_NUMBER } from "./shelf-model";
import type { PostListItem } from "../lib/posts";

const post = (over: Partial<PostListItem> = {}): PostListItem =>
  ({
    slug: "tosov",
    title: "Төсөв батлагдлаа",
    kicker: "ЧУУЛГАН",
    lead: "Товч",
    date: new Date("2026-11-26T00:00:00Z"),
    publishedAt: new Date("2026-11-26T00:00:00Z"),
    updatedAt: new Date("2026-11-26T00:00:00Z"),
    categorySlug: "tosov",
    categoryName: "Төсөв",
    tags: [],
    reporter: null,
    motif: "bars",
    theme: 0,
    look: null,
    imageUrl: null,
    featured: false,
    ...over,
  }) as PostListItem;

describe("shelfBooks", () => {
  it("мэдээ бүрт /news/<slug> холбоос", () => {
    expect(shelfBooks([post()])[0].href).toBe("/news/tosov");
  });

  it("нурууны дугаар artifact-ийн 141-ээс эхэлнэ", () => {
    const books = shelfBooks([post({ slug: "a" }), post({ slug: "b" })]);
    expect(books.map((b) => b.number)).toEqual(["№ 141", "№ 142"]);
    expect(SHELF_FIRST_NUMBER).toBe(141);
  });

  it("нурууны огноо нь сар.өдөр", () => {
    expect(shelfBooks([post()])[0].date).toBe("11.26");
  });

  it("нурууны шошго нь ангиллын нэр", () => {
    expect(shelfBooks([post()])[0].spineLabel).toBe("Төсөв");
  });

  it("өнгө нь палитраас, light нь дэвсгэрээс", () => {
    const b = shelfBooks([post({ theme: 0 })])[0];
    expect(b.bg).toBe("#0A22E0");
    expect(b.fg).toBe("#F3F0EA");
    expect(b.light).toBe(false);
  });

  it("цайвар дэвсгэртэй палитр нь light=true", () => {
    expect(shelfBooks([post({ theme: 1 })])[0].light).toBe(true);
  });

  /**
   * Хавтас нь HTML-д шингэхгүй, кэшлэгдэх хаягаар ирнэ. Shelf нь client
   * component тул props нь HTML-д БА RSC payload-д хоёр удаа цувруулагдана:
   * 12 хавтас inline байвал ~84 KB — хэмжсэн зорилт (100 KB) давна.
   */
  it("хавтас нь хаягаар ирнэ, SVG нь HTML-д шингэхгүй", () => {
    const b = shelfBooks([post()])[0];
    expect(b.coverUrl).toBe("/cover/tosov");
    expect(JSON.stringify(b)).not.toContain("<svg");
  });

  it("slug-ийг хаягт зориулж кодчилно", () => {
    expect(shelfBooks([post({ slug: "а б" })])[0].coverUrl).toBe("/cover/%D0%B0%20%D0%B1");
  });

  it("мэдээ байхгүй бол хоосон массив — тавиур хоосон зурна", () => {
    expect(shelfBooks([])).toEqual([]);
  });

  it("kicker байхгүй бол гарчгаар эргэнэ", () => {
    expect(shelfBooks([post({ kicker: null })])[0].kicker).toBe("Төсөв батлагдлаа");
  });

  it("lead байхгүй бол хоосон мөр, null биш", () => {
    expect(shelfBooks([post({ lead: null })])[0].lead).toBe("");
  });

  it("alt-д зориулсан гарчиг үлдэнэ", () => {
    expect(shelfBooks([post()])[0].title).toBe("Төсөв батлагдлаа");
  });
});
