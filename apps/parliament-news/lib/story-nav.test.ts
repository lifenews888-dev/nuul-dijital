import { describe, it, expect } from "vitest";
import { nextStory, STORY_MS } from "./story-nav";

describe("nextStory", () => {
  it("дараагийнх руу шилжинэ", () => {
    expect(nextStory(0, 3, 1)).toBe(1);
    expect(nextStory(1, 3, 1)).toBe(2);
  });

  it("өмнөх рүү шилжинэ", () => {
    expect(nextStory(2, 3, -1)).toBe(1);
  });

  it("эцсийнхээс цааш явахгүй — null (хаана гэсэн дохио)", () => {
    expect(nextStory(2, 3, 1)).toBeNull();
  });

  it("эхнийхээс өмнө явахгүй", () => {
    expect(nextStory(0, 3, -1)).toBeNull();
  });

  it("нэг л стори байхад хоёр тал null", () => {
    expect(nextStory(0, 1, 1)).toBeNull();
    expect(nextStory(0, 1, -1)).toBeNull();
  });

  it("стори байхгүй үед null", () => {
    expect(nextStory(0, 0, 1)).toBeNull();
    expect(nextStory(0, 0, -1)).toBeNull();
  });

  /** Жагсаалт богиносвол (стори хугацаа нь дуусвал) индекс хальж болно */
  it("хүрээнээс гадуур индекст null", () => {
    expect(nextStory(9, 3, 1)).toBeNull();
    expect(nextStory(-1, 3, 1)).toBeNull();
  });
});

describe("STORY_MS", () => {
  it("artifact-ийн `sDur` — 6 секунд", () => {
    expect(STORY_MS).toBe(6000);
  });
});
