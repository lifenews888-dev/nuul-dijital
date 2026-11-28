import { describe, it, expect } from "vitest";
import { resultToUpdate } from "./social-result";

const NOW = new Date("2026-11-28T10:00:00Z");

describe("resultToUpdate", () => {
  it("амжилттай нь SENT, хугацаатай, алдаагүй", () => {
    const got = resultToUpdate({ ok: true, url: "https://t.me/a/1" }, 0, NOW);
    expect(got.status).toBe("SENT");
    expect(got.sentAt).toEqual(NOW);
    expect(got.error).toBeNull();
    expect(got.remoteUrl).toBe("https://t.me/a/1");
  });

  it("тохируулаагүй суваг нь SKIPPED — дахин оролдохгүй", () => {
    const got = resultToUpdate({ ok: false, error: "тохируулаагүй", configured: false }, 0, NOW);
    expect(got.status).toBe("SKIPPED");
    expect(got.attempts).toBe(0);
  });

  it("алдаа нь FAILED, оролдлого нэмэгдэнэ", () => {
    const got = resultToUpdate({ ok: false, error: "429 Too Many", configured: true }, 1, NOW);
    expect(got.status).toBe("FAILED");
    expect(got.attempts).toBe(2);
    expect(got.error).toContain("429");
  });

  it("алдааны мөрийг таслана — сан 400 тэмдэгт", () => {
    const got = resultToUpdate({ ok: false, error: "x".repeat(900), configured: true }, 0, NOW);
    expect((got.error ?? "").length).toBeLessThanOrEqual(400);
  });

  it("амжилттай ч хаяггүй бол null", () => {
    expect(resultToUpdate({ ok: true, url: null }, 0, NOW).remoteUrl).toBeNull();
  });
});
