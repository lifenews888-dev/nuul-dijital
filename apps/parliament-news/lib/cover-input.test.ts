import { describe, it, expect } from "vitest";
import { coverUrl, plainCoverUrl } from "./cover-input";

describe("хавтасны хаягууд", () => {
  it("энгийн хавтас", () => {
    expect(coverUrl("turshilt")).toBe("/cover/turshilt");
  });

  it("текстгүй хавтас нь өөрийн замтай — query биш", () => {
    // Query уншвал route нь динамик болж, 12 хавтасны кэш алдагдана
    expect(plainCoverUrl("turshilt")).toBe("/cover/turshilt/plain");
  });

  it("хаягийн тэмдэгтүүдийг зугтаана", () => {
    expect(coverUrl("a b/c")).toBe("/cover/a%20b%2Fc");
    expect(plainCoverUrl("a b/c")).toBe("/cover/a%20b%2Fc/plain");
  });
});
