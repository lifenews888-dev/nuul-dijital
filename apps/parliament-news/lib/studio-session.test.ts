import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Студийн сессийн ГУРВАН хаалга: нэвтэрсэн эсэх, tenant танигдсан эсэх,
 * редакцын гишүүн эсэх. Гурвын аль нэг нь хоосон бол сесс БАЙХГҮЙ.
 *
 * Жинхэнэ хүсэлтгүйгээр `getServerSession` ажиллахгүй тул гурван хамаарлыг
 * mock-лон, ЗӨВХӨН нийлүүлэх логикийг шалгана. Гишүүний мөрийн өөрийнх нь
 * дүрэм (`active`, үүрэг) нь `studio-session.db.test.ts`-д, жинхэнэ сан дээр.
 */

const getServerSession = vi.fn();
const getTenant = vi.fn();
const getNewsRole = vi.fn();
const redirect = vi.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("./tenant", () => ({ getTenant: () => getTenant() }));
vi.mock("./trpc", () => ({
  getNewsRole: (...args: unknown[]) => getNewsRole(...args),
}));
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));

import { studioSession, requireStudio } from "./studio-session";

const SESSION = {
  user: { id: "u1", name: "Болд", email: "bold@parlamentnews.mn" },
};

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(SESSION);
  getTenant.mockResolvedValue({ id: "t1", slug: "parlament" });
  getNewsRole.mockResolvedValue("CHIEF");
});

describe("studioSession", () => {
  it("гурвууланг нь хангасан бол сесс буцаана", async () => {
    expect(await studioSession()).toEqual({
      actor: { userId: "u1", role: "CHIEF" },
      tenantId: "t1",
      name: "Болд",
      email: "bold@parlamentnews.mn",
    });
  });

  it("нэвтрээгүй бол null", async () => {
    getServerSession.mockResolvedValue(null);
    expect(await studioSession()).toBeNull();
    expect(getNewsRole).not.toHaveBeenCalled();
  });

  it("session-д хэрэглэгчийн id байхгүй бол null", async () => {
    getServerSession.mockResolvedValue({ user: { name: "Болд" } });
    expect(await studioSession()).toBeNull();
  });

  /** Tenant танигдаагүй бол эрхийг ХААНААС ч шалгаж болохгүй */
  it("tenant олдохгүй бол null, гишүүнийг шалгахгүй", async () => {
    getTenant.mockResolvedValue(null);
    expect(await studioSession()).toBeNull();
    expect(getNewsRole).not.toHaveBeenCalled();
  });

  /** Review Focus #1: нэвтэрсэн нь эрх ОЛГОХГҮЙ */
  it("нэвтэрсэн ч редакцын гишүүн биш бол null", async () => {
    getNewsRole.mockResolvedValue(null);
    expect(await studioSession()).toBeNull();
  });

  it("эрхийг тухайн tenant дотор нь шалгана", async () => {
    await studioSession();
    expect(getNewsRole).toHaveBeenCalledWith("t1", "u1");
  });

  it("имэйлгүй сесс ч эвдэрхгүй", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    const s = await studioSession();
    expect(s).not.toBeNull();
    expect(s?.email).toBe("");
    expect(s?.name).toBeNull();
  });
});

describe("requireStudio", () => {
  it("сесстэй бол түүнийг өгнө, redirect хийхгүй", async () => {
    const s = await requireStudio();
    expect(s.actor.role).toBe("CHIEF");
    expect(redirect).not.toHaveBeenCalled();
  });

  /**
   * Эрхгүй хүн студийн хуудсыг ХАРАХГҮЙ. `middleware` нь зөвхөн нэвтэрсэн
   * эсэхийг шалгадаг тул гишүүн биш хүн замаар шууд орж чадна — хуудас бүр
   * үүнийг дуудна.
   */
  it("гишүүн биш бол нэвтрэх рүү шиднэ", async () => {
    getNewsRole.mockResolvedValue(null);
    await expect(requireStudio()).rejects.toThrow("REDIRECT:/studio/signin");
    expect(redirect).toHaveBeenCalledWith("/studio/signin");
  });

  it("нэвтрээгүй бол ч нэвтрэх рүү шиднэ", async () => {
    getServerSession.mockResolvedValue(null);
    await expect(requireStudio()).rejects.toThrow("REDIRECT:/studio/signin");
  });
});
