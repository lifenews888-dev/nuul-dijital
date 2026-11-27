import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@nuul/db-news";
import type { NewsRole, NewsStatus } from "@nuul/db-news";
import { tenantSlug } from "@/lib/tenant";
import { forTenant } from "@/lib/tenant-db";
import type { Ctx } from "@/lib/trpc";
import { appRouter } from "./index";

/**
 * РЕДАКЦЫН УРСГАЛ — серверийн хаалга.
 *
 * `lib/permissions.test.ts` нь матрицыг цэвэр функц дээр барина. Энэ файл
 * нь ТЭР МАТРИЦ МУТАЦИД ХҮРЧ БАЙГААГ барина: UI-д товч нуух нь
 * хамгаалалт биш, `fetch`-ээр procedure-ийг гараар дуудаж болно. Review
 * Focus #2, #3, #4 бүгд энд.
 */
/**
 * `revalidatePath` нь Next-ийн рендерийн сангаас гадуур «static generation
 * store missing» гэж шиддэг — tRPC-ийн route handler дотор ажилладаг ч
 * тестэд тэр нөхцөл байхгүй. Иймд mock-лоод, ДУУДАГДСАН ЭСЭХИЙГ өөрийг
 * нь батламж болгоно (Review Focus #5).
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

/**
 * Файл тус бүрийн дагавар. `Date.now()` ДАНГААРАА хүрэхгүй: vitest нь
 * файлуудыг зэрэгцээ ажиллуулдаг тул хоёр файл нэг миллисекундэд эхэлж,
 * ИЖИЛ дагавар авч болно. Тэр үед нэг файлын `sfx`-ээр хийсэн хайлт
 * нөгөөгийн өгөгдлийг олж, тест үл баригдах болно (бодитоор тохиолдсон:
 * `posts.db.test.ts`-ийн «том/жижиг үсэг» тест 4 ажиллуулалтаас 2-т
 * улаан болов). Санамсаргүй сүүл нь түүнийг хаана.
 */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;

const S = {
  draft: `wf-draft-${sfx}`,
  review: `wf-review-${sfx}`,
  approved: `wf-approved-${sfx}`,
  published: `wf-published-${sfx}`,
  returned: `wf-returned-${sfx}`,
  /** Бусдын ноорог — сэтгүүлч хүрэх ёсгүй */
  other: `wf-other-${sfx}`,
  /** Устгах туршилтад */
  trash: `wf-trash-${sfx}`,
  /** ӨӨР tenant-д — ямар ч эрхээр хүрэх ёсгүй */
  foreign: `wf-foreign-${sfx}`,
};

const EMAIL = {
  me: `wf-me-${sfx}@test.local`,
  other: `wf-other-${sfx}@test.local`,
};

let tenantId: string;
let foreignTenantId: string;
let myId: string;
let otherId: string;
const ids: Record<string, string> = {};

/** Үүрэг сонгон caller үүсгэнэ — нэг хэрэглэгч, өөр өөр эрхтэй */
function caller(role: NewsRole, who: "me" | "other" = "me") {
  const userId = who === "me" ? myId : otherId;
  const ctx: Ctx = {
    db: forTenant(tenantId),
    tenantId,
    session: { user: { id: userId }, expires: "" } as Ctx["session"],
    role,
  };
  return appRouter.createCaller(ctx);
}

const statusOf = async (id: string): Promise<NewsStatus | undefined> =>
  (await prisma.newsPost.findUnique({ where: { id }, select: { status: true } }))?.status;

async function makePost(
  slug: string,
  status: NewsStatus,
  authorId: string | null,
  tId: string,
): Promise<string> {
  const row = await prisma.newsPost.create({
    data: {
      tenantId: tId,
      slug,
      title: `Урсгал ${slug}`,
      date: new Date("2026-11-20T00:00:00Z"),
      status,
      authorId,
      publishedAt: status === "PUBLISHED" ? new Date("2026-11-20T06:00:00Z") : null,
    },
    select: { id: true },
  });
  return row.id;
}

beforeAll(async () => {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug() } });
  if (!tenant) throw new Error(`Tenant "${tenantSlug()}" олдсонгүй — seed ажиллуулна уу`);
  tenantId = tenant.id;

  const foreign = await prisma.tenant.create({
    data: { slug: `wf-foreign-${sfx}`, name: `Гадны сайт ${sfx}` },
    select: { id: true },
  });
  foreignTenantId = foreign.id;

  const [me, other] = await Promise.all([
    prisma.user.create({ data: { email: EMAIL.me, name: `Би ${sfx}` } }),
    prisma.user.create({ data: { email: EMAIL.other, name: `Бусад ${sfx}` } }),
  ]);
  myId = me.id;
  otherId = other.id;
});

/** Тест бүр цэвэр төлөвөөс эхэлнэ — мутаци нь мөрийг хөдөлгөдөг */
beforeEach(async () => {
  vi.mocked(revalidatePath).mockClear();
  await prisma.newsActivity.deleteMany({ where: { postId: { in: Object.values(ids) } } });
  await prisma.newsPost.deleteMany({ where: { slug: { in: Object.values(S) } } });

  ids.draft = await makePost(S.draft, "DRAFT", myId, tenantId);
  ids.review = await makePost(S.review, "REVIEW", myId, tenantId);
  ids.approved = await makePost(S.approved, "APPROVED", myId, tenantId);
  ids.published = await makePost(S.published, "PUBLISHED", myId, tenantId);
  ids.returned = await makePost(S.returned, "RETURNED", myId, tenantId);
  ids.other = await makePost(S.other, "DRAFT", otherId, tenantId);
  ids.trash = await makePost(S.trash, "DRAFT", myId, tenantId);
  ids.foreign = await makePost(S.foreign, "APPROVED", myId, foreignTenantId);
});

afterAll(async () => {
  await prisma.newsActivity.deleteMany({ where: { tenantId: { in: [tenantId, foreignTenantId] } } });
  await prisma.newsPost.deleteMany({ where: { slug: { in: Object.values(S) } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAIL) } } });
  await prisma.tenant.delete({ where: { id: foreignTenantId } });
});

describe("studioNews.act — эрхийн хаалга", () => {
  it("шинжээч нийтлэх гэвэл татгалзана", async () => {
    await expect(
      caller("ANALYST").studioNews.act({ id: ids.approved, action: "publish" }),
    ).rejects.toThrow(/эрх/);
    expect(await statusOf(ids.approved)).toBe("APPROVED");
  });

  it("хянагч нийтлэхгүй", async () => {
    await expect(
      caller("REVIEWER").studioNews.act({ id: ids.approved, action: "publish" }),
    ).rejects.toThrow(/эрх/);
    expect(await statusOf(ids.approved)).toBe("APPROVED");
  });

  /** Review Focus #3 */
  it("сэтгүүлч БУСДЫН мэдээг илгээхгүй", async () => {
    await expect(
      caller("REPORTER").studioNews.act({ id: ids.other, action: "submit" }),
    ).rejects.toThrow(/эрх/);
    expect(await statusOf(ids.other)).toBe("DRAFT");
  });

  it("сэтгүүлч өөрийн ноорогоо илгээнэ", async () => {
    const res = await caller("REPORTER").studioNews.act({ id: ids.draft, action: "submit" });
    expect(res.status).toBe("REVIEW");
    expect(await statusOf(ids.draft)).toBe("REVIEW");
  });

  /** Review Focus #4 */
  it("approve нь зөвхөн REVIEW-ээс", async () => {
    await expect(
      caller("CHIEF").studioNews.act({ id: ids.draft, action: "approve" }),
    ).rejects.toThrow(/эрх/);
    await expect(
      caller("CHIEF").studioNews.act({ id: ids.approved, action: "approve" }),
    ).rejects.toThrow(/эрх/);
  });

  it("unpublish нь зөвхөн PUBLISHED-ээс", async () => {
    await expect(
      caller("CHIEF").studioNews.act({ id: ids.draft, action: "unpublish" }),
    ).rejects.toThrow(/эрх/);
  });

  it("нийтлэгдсэн мэдээг дахин нийтлэхгүй", async () => {
    await expect(
      caller("CHIEF").studioNews.act({ id: ids.published, action: "publish" }),
    ).rejects.toThrow(/эрх/);
  });

  it("буцаасан мэдээг дахин илгээж болно", async () => {
    const res = await caller("REPORTER").studioNews.act({ id: ids.returned, action: "submit" });
    expect(res.status).toBe("REVIEW");
  });

  it("байхгүй мэдээ — NOT_FOUND", async () => {
    await expect(
      caller("SUPER").studioNews.act({ id: "no-such-post", action: "publish" }),
    ).rejects.toThrow(/олдсонгүй/);
  });

  /** Tenant-ийн хаалга эрхээс ДЭЭГҮҮР */
  it("өөр tenant-ийн мэдээнд супер админ ч хүрэхгүй", async () => {
    await expect(
      caller("SUPER").studioNews.act({ id: ids.foreign, action: "publish" }),
    ).rejects.toThrow();
    expect(await statusOf(ids.foreign)).toBe("APPROVED");
  });

  /**
   * ЭРХИЙН хаалгыг барих тул оролт нь бусад талаар ХҮЧИНТЭЙ байх ёстой:
   * `return`-д тайлбар өгөхгүй бол татгалзалт нь zod-оос ирж, эрхийн
   * шалгалт хүрэхгүйг нь бид мэдэхгүй болно.
   */
  it("эрхгүй үүрэг БҮХ үйлдэлд татгалзана", async () => {
    const actions = ["submit", "approve", "return", "publish", "unpublish"] as const;
    for (const role of ["ANALYST", "LIVE", "SOCIAL", "LEGAL", "MEDIA", "CONTRIBUTOR"] as NewsRole[]) {
      for (const action of actions) {
        /** CONTRIBUTOR нь өөрийн ноорог дээр submit хийж ЧАДНА — тэр нь энэ тестийн гадна */
        if (role === "CONTRIBUTOR" && action === "submit") continue;
        await expect(
          caller(role).studioNews.act({ id: ids.review, action, note: "тайлбар" }),
          `${role} / ${action}`,
        ).rejects.toThrow(/эрх/);
      }
    }
    expect(await statusOf(ids.review)).toBe("REVIEW");
  });

  /** Хяналтын #8 — матрицын хоёр цоорхой */
  it("медиа редактор, зочин зохиогч ч урсгалыг хөдөлгөхгүй", async () => {
    await expect(
      caller("MEDIA").studioNews.act({ id: ids.draft, action: "submit" }),
    ).rejects.toThrow(/эрх/);
    await expect(
      caller("CONTRIBUTOR").studioNews.act({ id: ids.other, action: "submit" }),
    ).rejects.toThrow(/эрх/);
    await expect(
      caller("CONTRIBUTOR").studioNews.act({ id: ids.approved, action: "publish" }),
    ).rejects.toThrow(/эрх/);
  });
});

/**
 * Хяналтын #1 — буцаалтын тайлбар нь СЕРВЕРТ шаардагдана.
 *
 * `admin.html:1220` нь хоосон тайлбарыг татгалзана, README нь «Тайлбар нь
 * ЗААВАЛ» гэж бичсэн, формын textarea нь `required`. Гэтэл procedure-ийг
 * гараар дуудаж болно: `{"action":"return"}` гэж илгээвэл мэдээ
 * «Буцаасан» болж, сэтгүүлч юу засахаа ХЭЗЭЭ Ч мэдэхгүй — бүртгэлийн
 * мөр ч хэлэхгүй. Энэ нь «UI-д нуух нь хамгаалалт биш» гэдгийн яг тэр
 * хэлбэр, урсгалын цорын нэг заавал талбар дээр.
 */
describe("studioNews.act — буцаалтын тайлбар", () => {
  it("тайлбаргүй буцаалтыг татгалзана", async () => {
    await expect(
      caller("REVIEWER").studioNews.act({ id: ids.review, action: "return" }),
    ).rejects.toThrow(/тайлбар/i);
    expect(await statusOf(ids.review)).toBe("REVIEW");
  });

  it("зөвхөн хоосон зайтай тайлбарыг ч татгалзана", async () => {
    await expect(
      caller("REVIEWER").studioNews.act({ id: ids.review, action: "return", note: "   " }),
    ).rejects.toThrow(/тайлбар/i);
    expect(await statusOf(ids.review)).toBe("REVIEW");
  });

  it("тайлбартай бол явна", async () => {
    const res = await caller("REVIEWER").studioNews.act({
      id: ids.review,
      action: "return",
      note: "Эх сурвалж дутуу",
    });
    expect(res.status).toBe("RETURNED");
  });

  /** Бусад үйлдэл тайлбар ШААРДАХГҮЙ — зөвхөн буцаалт */
  it("бусад үйлдэл тайлбаргүйгээр явна", async () => {
    await expect(
      caller("REVIEWER").studioNews.act({ id: ids.review, action: "approve" }),
    ).resolves.toEqual({ status: "APPROVED" });
  });
});

describe("studioNews.act — төлөв ба огноо", () => {
  it("нийтлэхэд publishedAt тавигдана", async () => {
    await caller("CHIEF").studioNews.act({ id: ids.approved, action: "publish" });
    const row = await prisma.newsPost.findUnique({ where: { id: ids.approved } });
    expect(row?.status).toBe("PUBLISHED");
    expect(row?.publishedAt).toBeInstanceOf(Date);
  });

  /**
   * Буулгахад `publishedAt` цэвэрлэгдэх ёстой: нийтийн шүүлт нь
   * `publishedAt <= now` -ээр явдаг тул үлдвэл мэдээ төлөв нь DRAFT
   * болсон ч нийтийн жагсаалтад үлдэж магадгүй.
   */
  it("буулгахад publishedAt цэвэрлэгдэнэ", async () => {
    await caller("CHIEF").studioNews.act({ id: ids.published, action: "unpublish" });
    const row = await prisma.newsPost.findUnique({ where: { id: ids.published } });
    expect(row?.status).toBe("DRAFT");
    expect(row?.publishedAt).toBeNull();
  });

  it("буцаахад тайлбар мэдээнд хадгалагдана", async () => {
    await caller("REVIEWER").studioNews.act({
      id: ids.review,
      action: "return",
      note: "Эх сурвалж дутуу",
    });
    const row = await prisma.newsPost.findUnique({ where: { id: ids.review } });
    expect(row?.status).toBe("RETURNED");
    expect(row?.reviewNote).toBe("Эх сурвалж дутуу");
  });

  it("дахин илгээхэд хуучин тайлбар арилна", async () => {
    await caller("REVIEWER").studioNews.act({
      id: ids.review,
      action: "return",
      note: "Эх сурвалж дутуу",
    });
    await caller("REPORTER").studioNews.act({ id: ids.review, action: "submit" });
    const row = await prisma.newsPost.findUnique({ where: { id: ids.review } });
    expect(row?.reviewNote).toBeNull();
  });
});

describe("studioNews.act — үйл явдлын бүртгэл", () => {
  it("үйлдэл бүр бүртгэлд мөр үлдээнэ", async () => {
    const before = await prisma.newsActivity.count({ where: { postId: ids.draft } });
    await caller("REPORTER").studioNews.act({ id: ids.draft, action: "submit" });
    expect(await prisma.newsActivity.count({ where: { postId: ids.draft } })).toBe(before + 1);
  });

  it("татгалзсан үйлдэл бүртгэл үүсгэхгүй", async () => {
    const before = await prisma.newsActivity.count({ where: { postId: ids.draft } });
    await expect(
      caller("ANALYST").studioNews.act({ id: ids.draft, action: "submit" }),
    ).rejects.toThrow();
    expect(await prisma.newsActivity.count({ where: { postId: ids.draft } })).toBe(before);
  });

  it("буцаах тайлбар бүртгэлд хадгалагдана", async () => {
    await caller("REVIEWER").studioNews.act({
      id: ids.review,
      action: "return",
      note: "Эх сурвалж дутуу",
    });
    const last = await prisma.newsActivity.findFirst({
      where: { postId: ids.review },
      orderBy: { createdAt: "desc" },
    });
    expect(last?.note).toBe("Эх сурвалж дутуу");
    expect(last?.action).toBe("return");
    expect(last?.userId).toBe(myId);
  });

  it("бүртгэл нь tenant-тай нь холбогдоно", async () => {
    await caller("CHIEF").studioNews.act({ id: ids.approved, action: "publish" });
    const last = await prisma.newsActivity.findFirst({
      where: { postId: ids.approved },
      orderBy: { createdAt: "desc" },
    });
    expect(last?.tenantId).toBe(tenantId);
  });
});

describe("studioNews.remove", () => {
  it("сэтгүүлч өөрийн ноорогоо устгана", async () => {
    await caller("REPORTER").studioNews.remove({ id: ids.trash });
    expect(await prisma.newsPost.findUnique({ where: { id: ids.trash } })).toBeNull();
  });

  it("сэтгүүлч бусдын мэдээг устгахгүй", async () => {
    await expect(caller("REPORTER").studioNews.remove({ id: ids.other })).rejects.toThrow(/эрх/);
    expect(await prisma.newsPost.findUnique({ where: { id: ids.other } })).not.toBeNull();
  });

  it("сэтгүүлч хянуулахаар илгээснийг устгахгүй", async () => {
    await expect(caller("REPORTER").studioNews.remove({ id: ids.review })).rejects.toThrow(/эрх/);
  });

  it("ерөнхий редактор нийтлэгдсэнийг ч устгана", async () => {
    await caller("CHIEF").studioNews.remove({ id: ids.published });
    expect(await prisma.newsPost.findUnique({ where: { id: ids.published } })).toBeNull();
  });

  it("хянагч устгахгүй", async () => {
    await expect(caller("REVIEWER").studioNews.remove({ id: ids.draft })).rejects.toThrow(/эрх/);
  });

  /**
   * Устгасан мэдээний бүртгэл нь `postId: null`-тай үлдэнэ: мөр нь
   * хэнийх ч биш болсон ч «хэн, хэзээ устгасан» гэдэг нь үлдэх ёстой.
   */
  it("устгалт бүртгэлд үлдэнэ", async () => {
    /**
     * `action: "delete"`-ээр тоолж БОЛОХГҮЙ: өөр тестийн файл нэг л
     * tenant дотор зэрэг ажиллаж, мөн тийм мөр үүсгэнэ — тоолол нь
     * хоёр тестийн хооронд хөдөлж, аль нэг нь үл баригдах болно.
     * `note` нь устгасан мэдээний slug тул энэ файлын дагавартай.
     */
    await caller("CHIEF").studioNews.remove({ id: ids.trash });
    const row = await prisma.newsActivity.findFirst({
      where: { tenantId, action: "delete", note: S.trash },
    });
    expect(row).not.toBeNull();
    expect(row?.postId).toBeNull();
    expect(row?.userId).toBe(myId);
  });

  it("өөр tenant-ийн мэдээг устгахгүй", async () => {
    await expect(caller("SUPER").studioNews.remove({ id: ids.foreign })).rejects.toThrow();
    expect(await prisma.newsPost.findUnique({ where: { id: ids.foreign } })).not.toBeNull();
  });
});

/**
 * Review Focus #5 — нийтлэсэн мэдээ нийтийн хуудсанд ШУУД гарах ёстой.
 *
 * Нийтийн хуудас `revalidate = 300`-тай. Кэшийг хүчингүй болгохгүй бол
 * редактор «Нийтэллээ» гэсэн мессеж харсан ч сайт дээр 5 минут хүртэл
 * гарахгүй: тэр нь системийг эвдэрсэн гэж тооцогдоно, гэтэл ямар ч
 * алдаа лог-д гарахгүй.
 */
describe("кэшийн хүчингүй болголт", () => {
  it("нийтлэхэд нүүр ба нийтлэлийн зам шинэчлэгдэнэ", async () => {
    await caller("CHIEF").studioNews.act({ id: ids.approved, action: "publish" });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith(`/news/${S.approved}`);
  });

  it("буулгахад ч шинэчлэгдэнэ", async () => {
    await caller("CHIEF").studioNews.act({ id: ids.published, action: "unpublish" });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith(`/news/${S.published}`);
  });

  it("устгахад ч шинэчлэгдэнэ — устсан мэдээ нийтийн хуудсанд үлдэхгүй", async () => {
    await caller("CHIEF").studioNews.remove({ id: ids.published });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith(`/news/${S.published}`);
  });

  it("илгээх, батлах нь ч шинэчилнэ — ноорог нийтийн хуудсанд гарах ёсгүй", async () => {
    await caller("REPORTER").studioNews.act({ id: ids.draft, action: "submit" });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  /** Татгалзсан үйлдэл кэшийг хөндөх ШААРДЛАГАГҮЙ — юу ч өөрчлөгдөөгүй */
  it("татгалзсан үйлдэл кэшийг хөндөхгүй", async () => {
    await expect(
      caller("ANALYST").studioNews.act({ id: ids.approved, action: "publish" }),
    ).rejects.toThrow();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
