import { describe, it, expect, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { check, fail, clear } from "./rate-limit";

const key = `test:${randomBytes(6).toString("hex")}`;
const RULE = { limit: 3, windowMs: 60_000 };

afterAll(async () => {
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
  await prisma.$disconnect();
});

describe("check / fail / clear", () => {
  it("бүртгэлгүй түлхүүр нээлттэй", async () => {
    expect((await check(key, RULE)).ok).toBe(true);
  });

  it("ЗӨВХӨН алдаа тоологдоно — шалгалт тоолуурыг хөдөлгөхгүй", async () => {
    const k = `${key}-c`;
    for (let i = 0; i < 20; i++) await check(k, RULE);
    expect(await prisma.rateLimit.findUnique({ where: { key: k } })).toBeNull();
  });

  it("хязгаарт хүрвэл хаагдана", async () => {
    const k = `${key}-f`;
    for (let i = 0; i < 2; i++) await fail(k, RULE);
    expect((await check(k, RULE)).ok).toBe(true);

    await fail(k, RULE);
    const blocked = await check(k, RULE);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("амжилттай нэвтрэлт тоолуурыг ЦЭВЭРЛЭНЭ", async () => {
    const k = `${key}-s`;
    for (let i = 0; i < 9; i++) await fail(k, RULE);
    expect((await check(k, RULE)).ok).toBe(false);

    await clear([k]);
    expect((await check(k, RULE)).ok).toBe(true);
  });

  it("цонх дуусахад дахин нээгдэнэ", async () => {
    const k = `${key}-w`;
    for (let i = 0; i < 9; i++) await fail(k, RULE);
    await prisma.rateLimit.update({
      where: { key: k },
      data: { resetAt: new Date(Date.now() - 1000) },
    });
    expect((await check(k, RULE)).ok).toBe(true);
  });

  it("түлхүүрүүд бие биедээ нөлөөлөхгүй", async () => {
    await fail(`${key}-a`, RULE);
    expect((await check(`${key}-b`, RULE)).ok).toBe(true);
  });
});
