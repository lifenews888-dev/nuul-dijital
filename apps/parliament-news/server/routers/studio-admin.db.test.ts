import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import type { NewsRole } from "@nuul/db-news";
import { tenantSlug } from "@/lib/tenant";
import { forTenant } from "@/lib/tenant-db";
import type { Ctx } from "@/lib/trpc";
import { appRouter } from "./index";

/**
 * СУРТАЛЧИЛГААНЫ БАННЕР — серверийн хаалга.
 *
 * `lib/banner.test.ts` нь харуулах дүрмийг барина. Энэ нь ХАДГАЛАХ хаалгыг:
 * UI-д талбар нуух нь хамгаалалт биш, procedure-ийг `fetch`-ээр гараар
 * дуудаж болно.
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const BLOB = "https://pn.public.blob.vercel-storage.com";

let tenantId: string;
let userId: string;
let kept: { id: string }[] = [];

beforeAll(async () => {
  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug(), active: true } });
  if (!tenant) throw new Error("tenant алга — эхлээд seed");
  tenantId = tenant.id;

  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) throw new Error("хэрэглэгч алга");
  userId = user.id;

  kept = await prisma.banner.findMany({ where: { tenantId }, select: { id: true } });
});

afterAll(async () => {
  await prisma.banner.deleteMany({ where: { tenantId, id: { notIn: kept.map((b) => b.id) } } });
  await prisma.newsActivity.deleteMany({ where: { tenantId, action: "banners", userId } });
  await prisma.$disconnect();
});

function caller(role: NewsRole) {
  const ctx: Ctx = {
    db: forTenant(tenantId),
    tenantId,
    session: { user: { id: userId }, expires: "" } as Ctx["session"],
    role,
  };
  return appRouter.createCaller(ctx);
}

const row = (over: Record<string, unknown> = {}) => ({
  imageUrl: `${BLOB}/${sfx}.jpg`,
  kind: "image" as const,
  placement: "home" as const,
  paid: true,
  amount: 0,
  ...over,
});

describe("studioAdmin.banners", () => {
  it("баннер хадгалагдана", async () => {
    await caller("SUPER").studioAdmin.banners({
      rows: [row({ title: `${sfx}-нэг`, linkUrl: "https://a.mn" })],
    });
    const saved = await prisma.banner.findFirst({ where: { tenantId, title: `${sfx}-нэг` } });
    expect(saved?.linkUrl).toBe("https://a.mn");
    expect(saved?.placement).toBe("home");
  });

  it("blob БИШ хостын медиа татгалзана", async () => {
    await expect(
      caller("SUPER").studioAdmin.banners({ rows: [row({ imageUrl: "https://evil.mn/a.jpg" })] }),
    ).rejects.toThrow();
  });

  it("javascript: холбоос татгалзана", async () => {
    await expect(
      caller("SUPER").studioAdmin.banners({ rows: [row({ linkUrl: "javascript:alert(1)" })] }),
    ).rejects.toThrow(/http/i);
  });

  it("дуусах огноо нь эхлэхээс өмнө бол татгалзана", async () => {
    await expect(
      caller("SUPER").studioAdmin.banners({
        rows: [row({ startsOn: "2026-12-10", endsOn: "2026-12-01" })],
      }),
    ).rejects.toThrow(/огноо/i);
  });

  it("танихгүй байршил татгалзана", async () => {
    await expect(
      caller("SUPER").studioAdmin.banners({ rows: [row({ placement: "хакер" })] }),
    ).rejects.toThrow();
  });

  it("сэтгүүлч баннер засахгүй", async () => {
    await expect(
      caller("REPORTER").studioAdmin.banners({ rows: [row()] }),
    ).rejects.toThrow(/FORBIDDEN|эрх/i);
  });

  it("хадгалалт нь өмнөхийг бүрэн СОЛИНО — дараалал нь мөрийн дараалал", async () => {
    await caller("SUPER").studioAdmin.banners({
      rows: [row({ title: `${sfx}-a` }), row({ title: `${sfx}-b` })],
    });
    const saved = await prisma.banner.findMany({
      where: { tenantId, title: { startsWith: sfx } },
      orderBy: { order: "asc" },
    });
    expect(saved.map((b) => b.title)).toEqual([`${sfx}-a`, `${sfx}-b`]);
  });
});
