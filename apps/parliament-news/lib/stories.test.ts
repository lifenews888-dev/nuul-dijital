import { describe, it, expect } from "vitest";
import { orderStories, STORY_MAX } from "./stories";

type S = { slug: string; featured: boolean };
const s = (slug: string, featured = false): S => ({ slug, featured });

describe("orderStories", () => {
  it("хамгийн ихдээ 6", () => {
    expect(STORY_MAX).toBe(6);
    expect(orderStories(Array.from({ length: 10 }, (_, i) => s(`a${i}`)))).toHaveLength(6);
  });

  it("онцлох нь түрүүлнэ", () => {
    const out = orderStories([s("a"), s("b", true), s("c"), s("d", true)]);
    expect(out.slice(0, 2).every((x) => x.featured)).toBe(true);
  });

  it("онцлохгүй бол хуучнаас шинэ рүү — artifact-ийн reverse", () => {
    // Орж ирэх нь шинэ эхнийх
    const out = orderStories([s("shine"), s("dund"), s("huuchin")]);
    expect(out.map((x) => x.slug)).toEqual(["huuchin", "dund", "shine"]);
  });

  it("онцлохуудын дотоод эрэмбэ хадгалагдана", () => {
    const out = orderStories([s("shine", true), s("huuchin", true)]);
    expect(out.map((x) => x.slug)).toEqual(["huuchin", "shine"]);
  });

  it("хоосон бол хоосон", () => {
    expect(orderStories([])).toEqual([]);
  });

  it("эх массивыг өөрчлөхгүй", () => {
    const input = [s("a"), s("b", true)];
    orderStories(input);
    expect(input.map((x) => x.slug)).toEqual(["a", "b"]);
  });
});
