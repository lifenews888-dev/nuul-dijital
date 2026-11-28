import { describe, it, expect } from "vitest";
import { revealDelay, REVEAL_STEP, REVEAL_MAX } from "./motion";

describe("revealDelay", () => {
  it("эхнийх нь шууд", () => {
    expect(revealDelay(0)).toBe(0);
  });

  it("шаталсан", () => {
    expect(revealDelay(1)).toBe(REVEAL_STEP);
    expect(revealDelay(3)).toBe(REVEAL_STEP * 3);
  });

  it("хязгаараас хэтрэхгүй — аравдугаар карт хагас секунд хүлээхгүй", () => {
    expect(revealDelay(50)).toBe(REVEAL_MAX);
    expect(REVEAL_MAX).toBeLessThanOrEqual(400);
  });

  it("сөрөг индекс нь 0", () => {
    expect(revealDelay(-3)).toBe(0);
  });

  it("тоо биш нь 0 — алдаатай дуудлага хөдөлгөөнийг зогсоохгүй", () => {
    expect(revealDelay(Number.NaN)).toBe(0);
  });
});
