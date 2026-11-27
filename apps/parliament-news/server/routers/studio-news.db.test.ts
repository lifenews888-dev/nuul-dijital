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
/** Хуулийн төсөл ба шатууд нь мэдээ рүү заадаг — ТЭДНИЙГ ЭХЛЭЭД устгана */
async function dropFixtures(): Promise<void> {
  const posts = await prisma.newsPost.findMany({
    where: { slug: { in: Object.values(S) } },
    select: { id: true },
  });
  const postIds = posts.map((p) => p.id);
  const bills = await prisma.bill.findMany({
    where: { postId: { in: postIds } },
    select: { id: true },
  });
  await prisma.billStage.deleteMany({ where: { billId: { in: bills.map((b) => b.id) } } });
  await prisma.bill.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.newsActivity.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.newsPost.deleteMany({ where: { slug: { in: Object.values(S) } } });
}

beforeEach(async () => {
  vi.mocked(revalidatePath).mockClear();
  await dropFixtures();

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
  await dropFixtures();
  await prisma.newsActivity.deleteMany({ where: { tenantId: { in: [tenantId, foreignTenantId] } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAIL) } } });
  await prisma.tenant.delete({ where: { id: foreignTenantId } });
});

/**
 * `studioNews.save` — засварлагчийн цорын ганц бичих хаалга.
 *
 * Формд талбар нуух нь хамгаалалт БИШ: procedure-ийг `fetch`-ээр гараар
 * дуудаж болно. Эдгээр тест нь `pickEditable`-ийн шийдвэр мутацид
 * ХҮРЧ байгааг барина, цэвэр функц дээр биш.
 */
describe("studioNews.save", () => {
  const D = "2026-11-27";

  it("шинэ мэдээ үүсгэнэ, хаяг нь гарчгаас", async () => {
    const r = await caller("REPORTER").studioNews.save({ title: "Төсвийн хэлэлцүүлэг", date: D });
    const row = await prisma.newsPost.findUnique({ where: { id: r.id } });
    expect(row?.slug).toMatch(/tos/);
    expect(row?.status).toBe("DRAFT");
    expect(row?.authorId).toBe(myId);
    expect(row?.tenantId).toBe(tenantId);
    await prisma.newsActivity.deleteMany({ where: { postId: r.id } });
    await prisma.newsPost.delete({ where: { id: r.id } });
  });

  it("үүсгэх эрхгүй үүрэг татгалзана", async () => {
    await expect(caller("MEDIA").studioNews.save({ title: "X", date: D })).rejects.toThrow(/эрх/);
  });

  /**
   * Review Focus #1 — бүх талбар нь эрхгүй хэсэгт байвал ТАТГАЛЗАНА.
   *
   * Чимээгүй амжилт нь дор: редактор «хадгаллаа» гэсэн мессеж хараад
   * ажлаа алдана. Гарчиг нь мэдээж хөдлөхгүй.
   */
  it("зураг видеоны редактор ГАРЧГИЙГ солихгүй", async () => {
    const before = (await prisma.newsPost.findUnique({ where: { id: ids.draft } }))!.title;
    await expect(
      caller("MEDIA").studioNews.save({ id: ids.draft, title: "ХАКЕР", date: D }),
    ).rejects.toThrow(/эрх/);
    const after = await prisma.newsPost.findUnique({ where: { id: ids.draft } });
    expect(after?.title).toBe(before);
  });

  /**
   * Хэсэгчлэн зөвшөөрөгдсөн оролт: зөвшөөрөгдсөн нь ХАДГАЛАГДАЖ,
   * бусад нь чимээгүй хаягдана. `dropped` нь юу хаягдсаныг хэлнэ тул
   * дуудагч хэрэглэгчид мэдэгдэж чадна.
   */
  it("эрхтэй талбар хадгалагдаж, эрхгүй нь хаягдана", async () => {
    const before = (await prisma.newsPost.findUnique({ where: { id: ids.draft } }))!.title;
    const r = await caller("SOCIAL").studioNews.save({
      id: ids.draft,
      title: "ХАКЕР",
      date: D,
      channels: ["Сайт", "Facebook"],
    });
    const after = await prisma.newsPost.findUnique({ where: { id: ids.draft } });
    expect(after?.title).toBe(before);
    expect(after?.channels).toEqual(["Сайт", "Facebook"]);
    expect(r.dropped).toContain("title");
  });

  /** Хуулийн төслийг САНД бичих нь Task 7 — энд зөвхөн гарчигт хүрэхгүй нь */
  it("хуулийн хариуцагч гарчигт хүрэхгүй", async () => {
    const before = (await prisma.newsPost.findUnique({ where: { id: ids.draft } }))!.title;
    await caller("LEGAL").studioNews.save({
      id: ids.draft,
      title: "ХАКЕР",
      date: D,
      billEnabled: true,
      billStage: 2,
    });
    const after = await prisma.newsPost.findUnique({ where: { id: ids.draft } });
    expect(after?.title).toBe(before);
  });

  it("сэтгүүлч бусдын мэдээнд юу ч бичихгүй", async () => {
    const before = (await prisma.newsPost.findUnique({ where: { id: ids.other } }))!.title;
    await expect(
      caller("REPORTER").studioNews.save({ id: ids.other, title: "ХАКЕР", date: D }),
    ).rejects.toThrow(/эрх/);
    expect((await prisma.newsPost.findUnique({ where: { id: ids.other } }))?.title).toBe(before);
  });

  it("төлөвийг зөвхөн супер админ гараар тавина", async () => {
    await caller("CHIEF").studioNews.save({
      id: ids.draft,
      title: "Засав",
      date: D,
      status: "PUBLISHED",
    });
    expect(await statusOf(ids.draft)).toBe("DRAFT");

    await caller("SUPER").studioNews.save({
      id: ids.draft,
      title: "Засав",
      date: D,
      status: "APPROVED",
    });
    expect(await statusOf(ids.draft)).toBe("APPROVED");
  });

  /**
   * Review Focus #2 — `nextSlug`-ийн бодлого: НИЙТЛЭГДСЭН мэдээний хаяг
   * гарчиг засахад ХЭВЭЭР. Сошиалд тарсан холбоос үхэх ёсгүй.
   */
  it("нийтлэгдсэн мэдээний гарчиг засахад хаяг нь ХЭВЭЭР", async () => {
    const before = (await prisma.newsPost.findUnique({ where: { id: ids.published } }))!.slug;
    await caller("CHIEF").studioNews.save({
      id: ids.published,
      title: "Шинэ огт өөр гарчиг",
      date: D,
    });
    const after = await prisma.newsPost.findUnique({ where: { id: ids.published } });
    expect(after?.slug).toBe(before);
    expect(after?.title).toBe("Шинэ огт өөр гарчиг");
  });

  it("ноорогийн хаяг гарчгийг дагана — холбоосыг нь хэн ч хараагүй", async () => {
    await caller("REPORTER").studioNews.save({ id: ids.draft, title: "Огт өөр гарчиг", date: D });
    expect((await prisma.newsPost.findUnique({ where: { id: ids.draft } }))?.slug).toMatch(
      /ogt-oor/,
    );
  });

  /** Review Focus #3 */
  it("хоцорсон хадгалалт нөгөөгийн ажлыг дарж бичихгүй", async () => {
    const stale = (await prisma.newsPost.findUnique({ where: { id: ids.draft } }))!.updatedAt;
    await caller("CHIEF").studioNews.save({ id: ids.draft, title: "Эхнийх", date: D });
    await expect(
      caller("CHIEF").studioNews.save({
        id: ids.draft,
        title: "Хоёр дахь",
        date: D,
        expectedUpdatedAt: stale.toISOString(),
      }),
    ).rejects.toThrow(/өөрчлөгдсөн/);
    expect((await prisma.newsPost.findUnique({ where: { id: ids.draft } }))?.title).toBe("Эхнийх");
  });

  it("зөв updatedAt өгвөл хадгална", async () => {
    const now = (await prisma.newsPost.findUnique({ where: { id: ids.draft } }))!.updatedAt;
    await caller("CHIEF").studioNews.save({
      id: ids.draft,
      title: "Шинэчлэв",
      date: D,
      expectedUpdatedAt: now.toISOString(),
    });
    expect((await prisma.newsPost.findUnique({ where: { id: ids.draft } }))?.title).toBe(
      "Шинэчлэв",
    );
  });

  it("хадгалалт бүртгэлд мөр үлдээнэ", async () => {
    await caller("REPORTER").studioNews.save({ id: ids.draft, title: "Засав", date: D });
    const last = await prisma.newsActivity.findFirst({
      where: { postId: ids.draft },
      orderBy: { createdAt: "desc" },
    });
    expect(last?.action).toBe("save");
    expect(last?.userId).toBe(myId);
  });

  it("шинэ мэдээний бүртгэл нь create", async () => {
    const r = await caller("REPORTER").studioNews.save({ title: "Шинэхэн мэдээ", date: D });
    const last = await prisma.newsActivity.findFirst({
      where: { postId: r.id },
      orderBy: { createdAt: "desc" },
    });
    expect(last?.action).toBe("create");
    await prisma.newsActivity.deleteMany({ where: { postId: r.id } });
    await prisma.newsPost.delete({ where: { id: r.id } });
  });

  it("өөр tenant-ийн мэдээг засахгүй", async () => {
    await expect(
      caller("SUPER").studioNews.save({ id: ids.foreign, title: "ХАКЕР", date: D }),
    ).rejects.toThrow();
    expect((await prisma.newsPost.findUnique({ where: { id: ids.foreign } }))?.title).not.toBe(
      "ХАКЕР",
    );
  });

  it("байхгүй мэдээнд NOT_FOUND", async () => {
    await expect(
      caller("SUPER").studioNews.save({ id: "no-such-post", title: "X", date: D }),
    ).rejects.toThrow(/олдсонгүй/);
  });

  it("нийтлэгдсэн мэдээг засахад кэш шинэчлэгдэнэ", async () => {
    await caller("CHIEF").studioNews.save({ id: ids.published, title: "Засав", date: D });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("ноорог засахад кэш хөндөхгүй — нийтэд өөрчлөлт алга", async () => {
    await caller("REPORTER").studioNews.save({ id: ids.draft, title: "Засав", date: D });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("ангиллыг нэрээр нь холбоно", async () => {
    const cat = await prisma.newsCategory.findFirst({ where: { tenantId } });
    await caller("CHIEF").studioNews.save({
      id: ids.draft,
      title: "Ангилалтай",
      date: D,
      categoryName: cat!.name,
    });
    expect((await prisma.newsPost.findUnique({ where: { id: ids.draft } }))?.categoryId).toBe(
      cat!.id,
    );
  });

  it("танихгүй ангилалд хоосон үлдэнэ, унахгүй", async () => {
    await caller("CHIEF").studioNews.save({
      id: ids.draft,
      title: "Ангилалгүй",
      date: D,
      categoryName: "ИЙМ АНГИЛАЛ БАЙХГҮЙ",
    });
    expect(
      (await prisma.newsPost.findUnique({ where: { id: ids.draft } }))?.categoryId,
    ).toBeNull();
  });

  /** `look` нь Json? — баталгаажаагүй өгөгдөл хавтасны зурагч руу очих ёсгүй */
  it("буруу look-ийг цэвэрлэнэ", async () => {
    await caller("CHIEF").studioNews.save({
      id: ids.draft,
      title: "Хавтас",
      date: D,
      look: { bg: "ТОМ УТГА", lay: "ийм зохиомж алга", hog: 1 },
    });
    const row = await prisma.newsPost.findUnique({ where: { id: ids.draft } });
    expect(row?.look).not.toHaveProperty("hog");
  });
});

/**
 * Хуулийн төсөл — `Bill` ба `BillStage` нь ТУСДАА хүснэгт.
 *
 * Засварлагч нь нэг хадгалалтаар мэдээ, төсөл, таван шатыг бичнэ.
 * Унтраахад төсөл устах ёстой: үлдвэл нийтлэлийн хуудас хуучин шатыг
 * харуулсаар байна.
 */
describe("studioNews.save — хуулийн төсөл", () => {
  const D = "2026-11-27";
  const STEPS = [0, 1, 2, 3, 4].map((i) => ({ label: String(i), note: `Tailbar ${i}` }));

  it("төслийг үүсгэж, шат ба саналыг хадгална", async () => {
    await caller("LEGAL").studioNews.save({
      id: ids.draft,
      title: "IGNORED",
      date: D,
      billEnabled: true,
      billStage: 3,
      votesYes: 40,
      votesNo: 12,
      billSteps: STEPS,
    });

    const bill = await prisma.bill.findFirst({
      where: { postId: ids.draft },
      include: { stages: { orderBy: { index: "asc" } } },
    });
    expect(bill?.stage).toBe(3);
    expect(bill?.votesYes).toBe(40);
    expect(bill?.votesNo).toBe(12);
    expect(bill?.stages).toHaveLength(5);
    expect(bill?.stages[2].note).toBe("Tailbar 2");
  });

  it("дахин хадгалахад төсөл давхардахгүй", async () => {
    const save = () =>
      caller("LEGAL").studioNews.save({
        id: ids.draft,
        title: "IGNORED",
        date: D,
        billEnabled: true,
        billStage: 1,
        billSteps: STEPS,
      });
    await save();
    await save();
    expect(await prisma.bill.count({ where: { postId: ids.draft } })).toBe(1);
    expect(
      await prisma.billStage.count({
        where: { bill: { postId: ids.draft } },
      }),
    ).toBe(5);
  });

  it("шатыг шинэчилнэ, хуучныг үлдээхгүй", async () => {
    await caller("LEGAL").studioNews.save({
      id: ids.draft,
      title: "IGNORED",
      date: D,
      billEnabled: true,
      billStage: 2,
      billSteps: STEPS.map((x, i) => ({ ...x, note: `Shinechilsen ${i}` })),
    });
    const bill = await prisma.bill.findFirst({
      where: { postId: ids.draft },
      include: { stages: { orderBy: { index: "asc" } } },
    });
    expect(bill?.stages[0].note).toBe("Shinechilsen 0");
  });

  it("унтраавал төсөл устана", async () => {
    await caller("LEGAL").studioNews.save({
      id: ids.draft,
      title: "IGNORED",
      date: D,
      billEnabled: true,
      billStage: 1,
      billSteps: STEPS,
    });
    expect(await prisma.bill.count({ where: { postId: ids.draft } })).toBe(1);

    await caller("LEGAL").studioNews.save({
      id: ids.draft,
      title: "IGNORED",
      date: D,
      billEnabled: false,
    });
    expect(await prisma.bill.count({ where: { postId: ids.draft } })).toBe(0);
  });

  it("шат нь 0-4-ийн хооронд", async () => {
    await expect(
      caller("LEGAL").studioNews.save({
        id: ids.draft,
        title: "IGNORED",
        date: D,
        billEnabled: true,
        billStage: 9,
      }),
    ).rejects.toThrow();
  });

  it("эрхгүй үүрэг төсөлд хүрэхгүй", async () => {
    await expect(
      caller("SOCIAL").studioNews.save({
        id: ids.draft,
        title: "IGNORED",
        date: D,
        billEnabled: true,
        billStage: 2,
      }),
    ).rejects.toThrow(/эрх/);
  });

  it("төслийн гарчиг нь мэдээнийхээс авагдана", async () => {
    await caller("CHIEF").studioNews.save({
      id: ids.draft,
      title: "Tusgai huuliin tosol",
      date: D,
      billEnabled: true,
      billStage: 0,
    });
    const bill = await prisma.bill.findFirst({ where: { postId: ids.draft } });
    expect(bill?.title).toBe("Tusgai huuliin tosol");
  });
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
