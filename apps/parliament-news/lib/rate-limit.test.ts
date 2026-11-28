import { describe, it, expect } from "vitest";
import { nextWindow, decide, LIMITS } from "./rate-limit";

const T0 = new Date("2026-11-28T10:00:00Z");

describe("nextWindow", () => {
  it("цонх дуусаагүй бол хэвээр, тоолуур нэмэгдэнэ", () => {
    const got = nextWindow({ count: 2, resetAt: new Date("2026-11-28T10:05:00Z") }, 60_000, T0);
    expect(got.count).toBe(3);
    expect(got.resetAt.toISOString()).toBe("2026-11-28T10:05:00.000Z");
  });

  it("цонх дууссан бол ШИНЭ цонх, тоолуур 1", () => {
    const got = nextWindow({ count: 9, resetAt: new Date("2026-11-28T09:59:00Z") }, 60_000, T0);
    expect(got.count).toBe(1);
    expect(got.resetAt.getTime()).toBe(T0.getTime() + 60_000);
  });

  it("бичлэг байхгүй бол шинэ цонх", () => {
    const got = nextWindow(null, 60_000, T0);
    expect(got.count).toBe(1);
  });
});

describe("decide", () => {
  it("хязгаарын дотор бол зөвшөөрнө", () => {
    expect(decide(3, 5, new Date("2026-11-28T10:01:00Z"), T0).ok).toBe(true);
  });

  it("хязгаарт ХҮРСЭН бол татгалзана — 5 алдааны дараа 6 дахь оролдлого хаагдана", () => {
    expect(decide(5, 5, new Date("2026-11-28T10:01:00Z"), T0).ok).toBe(false);
  });

  it("хязгаарын өмнөх нь зөвшөөрөгдөнө", () => {
    expect(decide(4, 5, new Date("2026-11-28T10:01:00Z"), T0).ok).toBe(true);
  });

  it("хязгаараас хэтэрвэл татгалзана", () => {
    const got = decide(6, 5, new Date("2026-11-28T10:01:00Z"), T0);
    expect(got.ok).toBe(false);
    expect(got.retryAfter).toBe(60);
  });

  it("үлдсэн хугацааг секундээр, дээш бөөрөнхийлнө", () => {
    expect(decide(9, 5, new Date("2026-11-28T10:00:00.400Z"), T0).retryAfter).toBe(1);
  });

  it("цонх аль хэдийн дууссан бол 0 секунд", () => {
    expect(decide(9, 5, new Date("2026-11-28T09:59:00Z"), T0).retryAfter).toBe(0);
  });
});

describe("LIMITS", () => {
  it("имэйл тутамд цагт 10 БУРУУ оролдлого", () => {
    expect(LIMITS.signinEmail).toEqual({ limit: 10, windowMs: 3_600_000 });
  });

  it("IP тутамд илүү өгөөмөр — нэг оффисоос хэд хэдэн сэтгүүлч орно", () => {
    expect(LIMITS.signinIp.limit).toBeGreaterThan(LIMITS.signinEmail.limit);
  });
});
