# Parliament News 3b — мэдээ засварлагч

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Редакц мэдээг эхнээс нь бичиж, зураг видео оруулж, хавтсыг нь өөрийн гараар тохируулж, хадгалаад урсгалаар нийтлэх боломжтой болох.

**Architecture:** Засварлагч нь `/studio/news/[id]` ба `/studio/news/new`-д. Уншилт нь серверийн компонент (`lib/studio-post.ts`), бичилт нь ГАНЦ мутаци (`studioNews.save`). Формын төлөв нь нэг `useReducer`-д — хавтасны урьдчилан харалт тэр төлөвөөс шууд зурагдана, тиймээс редактор бичиж байхдаа номоо хардаг. Эрхийн шийдвэр нь 3a-ийн `lib/permissions.ts`-д хэвээр: `sectionsFor` нь UI-д хэсгийг түгжиж, мутацид талбарыг ШҮҮНЭ.

**Tech Stack:** Next.js 14 App Router, tRPC, Prisma 5, zod, vitest 2, Tailwind + `app/studio.css`, `@vercel/blob` (nuul.mn-д аль хэдийн хэрэглэгддэг, `BLOB_READ_WRITE_TOKEN` нь `.env`-д бэлэн).

**Spec:** `docs/superpowers/specs/2026-11-25-parliament-news-platform-design.md` (§5.4, §6-ийн 3-р алхам). Дизайны эх сурвалж: `apps/parliament-news/site-v2/admin.html`-ийн `v-edit` (:573-673) ба түүний JS (:1040-1230).

## Global Constraints

- Схемд ӨӨРЧЛӨЛТ ОРУУЛАХГҮЙ. `NewsPost`-ийн 28 талбар, `NewsMedia`, `Bill`, `BillStage`, `NewsSlugRedirect` бүгд бэлэн. `prisma db push` ажиллуулахгүй, `migrate dev` хэзээ ч биш.
- `eslint-disable` коммент бичихгүй — репогийн eslintrc нь plugin-ийн дүрмүүдийг ачаалдаггүй тул тохируулаагүй дүрмийг нэрлэсэн коммент өөрөө `next build`-ийг унагана.
- `next dev` ажиллаж байхад `next build` хийхгүй — `.next` түгжигдэж, хөтчийн шалгалт хуурамчаар улаан болно (3a-д бодитоор тохиолдсон).
- Бичих tRPC procedure бүр `editorialProcedure`-ээс эхэлж `lib/permissions.ts`-ийн шалгалт дамжина. Шалгалтгүй мутаци байж болохгүй.
- Нийтийн хуудсыг ХӨНДӨХГҮЙ. `pnpm check:browser`-ийн 24 шалгуур ногоон хэвээр байх ёстой.
- Хавтасны SVG-г `lib/cover.ts` ГАНЦААРАА зурна. Засварлагчийн урьдчилан харалт тэр л функцийг дуудна — хоёр дахь зурагч бичвэл тэд салж, редактор худал ном харна.
- Талбаруудын хязгаар `admin.html`-ээс ЯГ хэвээр: гарчиг 160, нурууны гарчиг 40, ангилал 40, сурвалжлагч 60, шошго 300, товч агуулга 300, биет 8000, сошиал 2200, эх сурвалж 20 ширхэг.

## ЭНЭ ТӨЛӨВЛӨГӨӨНД ОРООГҮЙ — загвар дуудсан боломжууд

`admin.html`-ийн «Редакцын туслах» нь Claude artifact-ийн `sample()`-ийг дууддаг: `ai1` (товч агуулга), `ai2` (гарчгийн санал), `ai3` (сошиал пост), `tool('fix'|'news'|'short'|'form')`, ба `rev*` хяналтын самбар — **долоон боломж бүгд**. Бидний апп-д тэр ажиллагаа байхгүй: Anthropic API-ийн түлхүүр, төлбөр, хурдны хязгаарлалт шаардана. Тусад нь шийдэх асуудал тул энд ОРООГҮЙ, товчнуудыг нь ч зурахгүй — ажиллахгүй товч нь байхгүй товчноос дор.

`t_mic` (ярьж бичүүлэх) нь хөтчийн `webkitSpeechRecognition` — үнэгүй боловч монгол хэлийг таних нь Chrome-д найдваргүй. Мөн ороогүй.

**Spec-тэй зөрчилдөх нэг зүйл: Tiptap.** Дизайн бичгийн §6-ийн 3-р алхамд
«Tiptap редактор» гэж нэрлэсэн. Гэтэл `admin.html` нь энгийн
`<textarea maxlength="8000">`-той бөгөөд нийтийн нийтлэлийн хуудас нь
биетийг `paragraphs(body)`-ээр ЦЭВЭР ТЕКСТ болгон, хоосон мөрөөр догол
мөр болгон зурдаг. Tiptap руу шилжих нь биетийг HTML болгоно: нийтийн
зурагч, `metaDescription`, `readMinutes` бүгд өөрчлөгдөж, засварлагчаар
дамжсан HTML-ийн тарилтын гадаргуу нээгдэнэ. Хэрэглэгчийн заавал
биелэх шаардлага нь «сайт яг artifact шиг байх», тэр нь цэвэр текстийн
догол мөр. Иймд **текстийн талбар** хэвээр. Баялаг засварлагч хэрэгтэй
бол тэр нь нийтийн зурагчийг хөндөх тусдаа шийдвэр.

## Review Focus

1. **Эрхгүй хэсэгт бичих.** `sectionsFor` нь UI-д хэсгийг түгжинэ. Гэтэл `studioNews.save`-ийг гараар дуудаж болно: `MEDIA` үүрэг `title`, `body` илгээвэл тэдгээр нь ХАДГАЛАГДАХ ЁСГҮЙ. Нуусан талбар нь хамгаалалт биш. → Task 1.
2. **Нийтлэгдсэн мэдээний хаяг гарчиг засахад ХӨДӨЛӨХ.** `lib/slug.ts`-ийн `nextSlug` нь нийтлэгдсэн мэдээний slug-ийг зориуд хөдөлгөдөггүй (`publishedAt !== null || status === "PUBLISHED"` бол хэвээр). Засварлагч түүнийг тойрч `toSlug(title)`-ийг шууд бичвэл сошиалд тарсан, Google-д индекслэгдсэн бүх холбоос 404 болно. → Task 1.
3. **Хоёр редактор зэрэг засах.** Нэг нь 10 минут бичээд хадгалахад нөгөөгийнх нь чимээгүй дарагдана. `updatedAt`-аар харьцуулж, зөрвөл ХЭЛНЭ. → Task 1.
4. **Байршуулалт дурын файл авах.** `.svg`, `.html` нь blob-ийн домэйнаас script ажиллуулна; хэмжээ хязгааргүй бол нэг хүн квотыг дүүргэнэ. Төрөл, хэмжээг СЕРВЕРТ шалгана. → Task 10.
5. **Цаг товлосон мэдээ «нийтлэгдлээ» гэж харагдах.** Ирээдүйн огноотой мэдээ нийтийн хуудсанд гарахгүй (`publishedAt <= now`). Засварлагч нь төлөв, огноог нэгэн зэрэг хөдөлгөдөг тул тэр хосыг зөв тавих ёстой. → Task 6.

---

## Файлын бүтэц

| Файл | Хариуцлага |
|---|---|
| `lib/studio-post-input.ts` | zod схем + `pickEditable(actor, post, input)` — эрхээр талбар шүүх. ЦЭВЭР. |
| `lib/studio-post.ts` | Засварлагчийн УНШИЛТ: `studioPost(tenantId, id)` |
| `lib/look-presets.ts` | Дизайн мастерын бэлэн загварууд, хяналтын утгууд. ЦЭВЭР. |
| `lib/upload.ts` | Файлын төрөл, хэмжээний шалгалт. ЦЭВЭР. |
| `server/routers/studio-news.ts` | `save`, `upload`-ийн дараах `attachMedia`, `removeMedia` (байгаа файлд нэмнэ) |
| `app/api/upload/route.ts` | `@vercel/blob`-ийн client upload-ийн токен гаргагч |
| `app/(studio)/studio/(desk)/news/new/page.tsx` | Шинэ мэдээ |
| `app/(studio)/studio/(desk)/news/[id]/page.tsx` | Байгаа мэдээ |
| `components/studio/editor/*` | Формын хэсгүүд: `editor-form`, `section-basic`, `section-photos`, `section-video`, `section-bill`, `section-look`, `section-src`, `section-pub`, `cover-preview` |

Засварлагчийн төлөв нь `components/studio/editor/editor-form.tsx`-д `useReducer`-ээр. Хэсгүүд нь төлөв ба `dispatch`-ийг авна — тус бүр нь өөрийн `useState` барихгүй: хавтасны урьдчилан харалт БҮХ талбараас хамаардаг тул төлөв тарвал урьдчилан харалт хоцорно.

---

### Task 1: Хадгалах мутаци — эрх, slug, зөрчил

Энэ бол аюулгүй байдлын гол даалгавар. Засварлагчийн бусад бүх хэсэг үүн рүү бичнэ.

**Files:**
- Create: `apps/parliament-news/lib/studio-post-input.ts`
- Create: `apps/parliament-news/lib/studio-post-input.test.ts`
- Modify: `apps/parliament-news/server/routers/studio-news.ts`
- Modify: `apps/parliament-news/server/routers/studio-news.db.test.ts`

**Interfaces:**
- Consumes: `sectionsFor`, `canCreate`, `canSetStatusManually`, `Actor`, `PostRef`, `Section` (`lib/permissions.ts`); `nextSlug`, `changeSlug` (`lib/slug.ts`); `logActivity` (`lib/activity.ts`); `ctxActor` (`lib/trpc.ts`).
- Produces:
  ```ts
  /** Талбар бүр ЯМАР хэсэгт харьяалагдах вэ — admin.html-ийн data-sec */
  export const FIELD_SECTION: Record<string, Section>;
  export const postInputSchema: z.ZodType<PostInput>;
  export type PostInput = {
    id?: string;
    title: string; kicker?: string | null; lead?: string | null; body?: string | null;
    categoryName?: string | null; subcategory?: string | null; date: string;
    reporter?: string | null; tags?: string[]; sources?: string[];
    motif?: string; theme?: number; look?: unknown;
    billEnabled?: boolean; billStage?: number; votesYes?: number; votesNo?: number;
    billSteps?: { label: string; note: string }[];
    channels?: string[]; social?: string | null;
    featured?: boolean; story?: boolean; storyDays?: number;
    status?: NewsStatus;
    /** Зөрчил илрүүлэх — уншсан үеийн утга */
    expectedUpdatedAt?: string;
  };
  /** Эрхгүй хэсгийн талбарыг ХАСНА — ҮЛДСЭНИЙГ нь буцаана */
  export function pickEditable(
    actor: Actor, post: PostRef, input: PostInput,
  ): { data: Partial<PostInput>; dropped: string[] };
  ```

- [ ] **Step 1: Write the failing tests** — `lib/studio-post-input.test.ts`

```ts
describe("FIELD_SECTION", () => {
  it("талбар бүр admin.html-ийн хэсэгт харьяална", () => {
    expect(FIELD_SECTION.title).toBe("basic");
    expect(FIELD_SECTION.body).toBe("basic");
    expect(FIELD_SECTION.sources).toBe("src");
    expect(FIELD_SECTION.look).toBe("look");
    expect(FIELD_SECTION.motif).toBe("look");
    expect(FIELD_SECTION.billStage).toBe("bill");
    expect(FIELD_SECTION.channels).toBe("pub");
    expect(FIELD_SECTION.social).toBe("pub");
    expect(FIELD_SECTION.featured).toBe("pub");
  });
});

describe("pickEditable", () => {
  it("зураг видеоны редактор ГАРЧГИЙГ бичихгүй", () => {
    const r = pickEditable(media, draft, { title: "Шинэ", body: "Текст", date: "2026-11-27" });
    expect(r.data.title).toBeUndefined();
    expect(r.dropped).toContain("title");
  });
  it("хуулийн хариуцагч зөвхөн bill, src-ийг", () => {
    const r = pickEditable(legal, draft, { billStage: 3, sources: ["a"], title: "X", date: D });
    expect(r.data.billStage).toBe(3);
    expect(r.data.sources).toEqual(["a"]);
    expect(r.data.title).toBeUndefined();
  });
  it("сэтгүүлч өөрийн ноорогт бүх хэсгээ бичнэ", () => {
    expect(pickEditable(reporter, ownDraft, FULL).dropped).toEqual([]);
  });
  it("сэтгүүлч БУСДЫН мэдээнд юу ч бичихгүй", () => {
    const r = pickEditable(reporter, othersDraft, FULL);
    expect(Object.keys(r.data)).toEqual([]);
  });
  it("төлөвийг зөвхөн супер админ гараар тавина", () => {
    expect(pickEditable(chief, draft, { ...FULL, status: "PUBLISHED" }).data.status).toBeUndefined();
    expect(pickEditable(suuper, draft, { ...FULL, status: "PUBLISHED" }).data.status).toBe("PUBLISHED");
  });
});

describe("postInputSchema", () => {
  it("admin.html-ийн хязгаарууд", () => {
    expect(() => postInputSchema.parse({ ...MIN, title: "a".repeat(161) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, kicker: "a".repeat(41) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, lead: "a".repeat(301) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, body: "a".repeat(8001) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, social: "a".repeat(2201) })).toThrow();
    expect(() => postInputSchema.parse({ ...MIN, sources: Array(21).fill("https://a.mn") })).toThrow();
  });
  it("гарчиг хоосон байж болохгүй", () => {
    expect(() => postInputSchema.parse({ ...MIN, title: "   " })).toThrow();
  });
  it("эх сурвалж нь http(s) байх ёстой", () => {
    expect(() => postInputSchema.parse({ ...MIN, sources: ["javascript:alert(1)"] })).toThrow();
  });
  it("огноо нь YYYY-MM-DD", () => {
    expect(() => postInputSchema.parse({ ...MIN, date: "2026/11/27" })).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/studio-post-input.test.ts`
Expected: FAIL — модуль байхгүй

- [ ] **Step 3: Implement `lib/studio-post-input.ts`**

`pickEditable` нь `sectionsFor(actor, post)`-ийг нэг удаа дуудаад, `FIELD_SECTION`-оор талбар бүрийг шүүнэ. `status` нь нэмэлт хаалгатай: `canSetStatusManually(actor)`.

- [ ] **Step 4: Run to verify they pass** — Expected: PASS

- [ ] **Step 5: Write the failing DB tests** — `studio-news.db.test.ts`-д `studioNews.save`

```ts
it("шинэ мэдээ үүсгэнэ, slug нь гарчгаас", async () => {
  const r = await caller("REPORTER").studioNews.save({ title: "Төсвийн хэлэлцүүлэг", date: D });
  const row = await prisma.newsPost.findUnique({ where: { id: r.id } });
  expect(row?.slug).toMatch(/tosv/);
  expect(row?.status).toBe("DRAFT");
  expect(row?.authorId).toBe(myId);
});
it("үүсгэх эрхгүй үүрэг татгалзана", async () => {
  await expect(caller("MEDIA").studioNews.save({ title: "X", date: D })).rejects.toThrow(/эрх/);
});
/** Review Focus #1 */
it("зураг видеоны редактор гарчгийг СОЛИХГҮЙ", async () => {
  await caller("MEDIA").studioNews.save({ id: ids.draft, title: "ХАКЕР", date: D });
  const row = await prisma.newsPost.findUnique({ where: { id: ids.draft } });
  expect(row?.title).not.toBe("ХАКЕР");
});
/**
 * Review Focus #2 — `nextSlug`-ийн бодлого: НИЙТЛЭГДСЭН мэдээний хаяг
 * гарчиг засахад ХЭВЭЭР. Сошиалд тарсан холбоос үхэх ёсгүй.
 */
it("нийтлэгдсэн мэдээний гарчиг засахад хаяг нь ХЭВЭЭР", async () => {
  const before = (await prisma.newsPost.findUnique({ where: { id: ids.published } }))!.slug;
  await caller("CHIEF").studioNews.save({ id: ids.published, title: "Шинэ огт өөр гарчиг", date: D });
  const after = await prisma.newsPost.findUnique({ where: { id: ids.published } });
  expect(after?.slug).toBe(before);
  expect(after?.title).toBe("Шинэ огт өөр гарчиг");
});
it("ноорогийн хаяг гарчгийг дагана — хэн ч холбоосыг нь хараахан хараагүй", async () => {
  await caller("REPORTER").studioNews.save({ id: ids.draft, title: "Огт өөр гарчиг", date: D });
  const after = await prisma.newsPost.findUnique({ where: { id: ids.draft } });
  expect(after?.slug).toMatch(/ogt-oor/);
});
it("хаяг давхардвал дугаар нэмнэ", async () => {
  // `ids.draft` нь аль хэдийн тэр гарчигтай — хоёр дахь нь өөр хаягтай байх ёстой
  const r = await caller("REPORTER").studioNews.save({ title: "Огт өөр гарчиг", date: D });
  const row = await prisma.newsPost.findUnique({ where: { id: r.id } });
  expect(row?.slug).not.toBe("ogt-oor-garchig");
});
/** Review Focus #3 */
it("хоцорсон хадгалалт нөгөөгийн ажлыг дарж бичихгүй", async () => {
  const stale = (await prisma.newsPost.findUnique({ where: { id: ids.draft } }))!.updatedAt;
  await caller("CHIEF").studioNews.save({ id: ids.draft, title: "Эхнийх", date: D });
  await expect(
    caller("CHIEF").studioNews.save({
      id: ids.draft, title: "Хоёр дахь", date: D, expectedUpdatedAt: stale.toISOString(),
    }),
  ).rejects.toThrow(/өөрчлөгдсөн/);
});
it("хадгалалт бүртгэлд мөр үлдээнэ", async () => {
  await caller("REPORTER").studioNews.save({ id: ids.draft, title: "Засав", date: D });
  const last = await prisma.newsActivity.findFirst({
    where: { postId: ids.draft }, orderBy: { createdAt: "desc" },
  });
  expect(last?.action).toBe("save");
});
it("шинэ мэдээний бүртгэл нь `create`", async () => { /* … */ });
it("өөр tenant-ийн мэдээг засахгүй", async () => {
  await expect(caller("SUPER").studioNews.save({ id: ids.foreign, title: "X", date: D }))
    .rejects.toThrow();
});
it("нийтлэгдсэн мэдээг засахад кэш шинэчлэгдэнэ", async () => {
  await caller("CHIEF").studioNews.save({ id: ids.published, title: "Засав", date: D });
  expect(revalidatePath).toHaveBeenCalledWith("/");
});
```

- [ ] **Step 6: Run to verify they fail**

- [ ] **Step 7: Implement `save` in `server/routers/studio-news.ts`**

`editorialProcedure` → `ctxActor` → `id` байвал `findFirst`-ээр унших (олдохгүй бол `NOT_FOUND`), үгүй бол `canCreate` шалгах → `pickEditable` → `expectedUpdatedAt` зөрвөл `CONFLICT` → slug нь `nextSlug({ title, currentSlug, publishedAt, status, taken })` — тэр функц нийтлэгдсэнийг хөдөлгөхгүй, давхардлыг өөрөө шийднэ. `taken` нь tenant доторх slug-ууд. `changeSlug` нь ГАРААР хаяг солих замд зориулагдсан; 3b-д тийм талбар байхгүй тул дуудагдахгүй → `updateMany`/`create` → `logActivity` (`create` эсвэл `save`) → нийтлэгдсэн байсан бол `revalidatePublic`.

Ангилал нь НЭРЭЭР ирнэ (`categoryName`) — `NewsCategory`-оос хайж `categoryId` тавина, байхгүй бол `null`.

`look` нь `Json?` тул дурын бүтэц ирж болно: санд бичихээс ӨМНӨ
`parseLook()` (`lib/cover.ts:112`)-ээр цэвэрлэнэ. Тэр функц танихгүй
талбар, буруу hex-ийг хаядаг — эс бөгөөс засварлагчаар дамжуулан
хавтасны зурагч руу баталгаажаагүй өгөгдөл очно.

- [ ] **Step 8: Run to verify they pass**

- [ ] **Step 9: Commit**

```bash
git commit -m "feat(editor): the save mutation, with section-aware field filtering"
```

---

### Task 2: Засварлагчийн уншилт

**Files:**
- Create: `apps/parliament-news/lib/studio-post.ts`
- Create: `apps/parliament-news/lib/studio-post.db.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type StudioPostFull = {
    id: string; slug: string; status: NewsStatus; authorId: string | null;
    title: string; kicker: string | null; lead: string | null; body: string | null;
    categoryName: string | null; subcategory: string | null;
    date: Date; reporter: string | null; tags: string[]; sources: string[];
    motif: string; theme: number; look: unknown;
    channels: string[]; social: string | null;
    featured: boolean; story: boolean; storyUntil: Date | null;
    publishedAt: Date | null; updatedAt: Date; reviewNote: string | null;
    media: { id: string; url: string; kind: string; caption: string | null; order: number }[];
    bill: { stage: number; votesYes: number; votesNo: number;
            steps: { label: string; note: string }[] } | null;
  };
  export function studioPost(tenantId: string, id: string): Promise<StudioPostFull | null>;
  /** Ангиллын сонголт — `<select>`-д */
  export function studioCategories(tenantId: string): Promise<string[]>;
  ```

- [ ] **Step 1: Write the failing DB tests**

```ts
it("ноорогийг ч уншина — нийтийн хаалга энд биш", async () => {
  expect(await studioPost(tenantId, ids.draft)).not.toBeNull();
});
it("медиаг дарааллаар нь", async () => {
  const p = await studioPost(tenantId, ids.withMedia);
  expect(p?.media.map((m) => m.order)).toEqual([0, 1, 2]);
});
it("хуулийн төслийн шатуудыг", async () => {
  expect((await studioPost(tenantId, ids.withBill))?.bill?.steps).toHaveLength(5);
});
it("хуулийн төсөлгүй бол null", async () => {
  expect((await studioPost(tenantId, ids.draft))?.bill).toBeNull();
});
it("өөр tenant-ийн мэдээг өгөхгүй", async () => {
  expect(await studioPost(tenantId, ids.foreign)).toBeNull();
});
it("байхгүй id-д null", async () => {
  expect(await studioPost(tenantId, "no-such")).toBeNull();
});
```

- [ ] **Step 2: Run to verify they fail**
- [ ] **Step 3: Implement** — `forTenant(tenantId).newsPost.findFirst` + `include` медиа (`orderBy: { order: "asc" }`), `bill` (`include: { steps: ... }`), `category`.
- [ ] **Step 4: Run to verify they pass**
- [ ] **Step 5: Commit** — `feat(editor): read a post with everything the form needs`

---

### Task 3: Засварлагчийн бүрхүүл ба урсгалын мөр

**Files:**
- Create: `apps/parliament-news/app/(studio)/studio/(desk)/news/new/page.tsx`
- Create: `apps/parliament-news/app/(studio)/studio/(desk)/news/[id]/page.tsx`
- Create: `apps/parliament-news/components/studio/editor/editor-form.tsx` (`"use client"`)
- Create: `apps/parliament-news/components/studio/editor/flow-bar.tsx`
- Create: `apps/parliament-news/lib/editor-state.ts`
- Create: `apps/parliament-news/lib/editor-state.test.ts`

**Interfaces:**
- Consumes: `studioPost` (Task 2), `requireStudio`, `sectionsFor`, `FLOW`, `STATUS_LABELS`.
- Produces:
  ```ts
  export type EditorState = { /* PostInput-ийн бүх талбар, формын хэлбэрээр */ };
  export type EditorAction = { type: "set"; field: keyof EditorState; value: unknown }
    | { type: "reset"; state: EditorState };
  export function editorReducer(state: EditorState, action: EditorAction): EditorState;
  export function emptyEditor(today: string): EditorState;
  export function editorFromPost(post: StudioPostFull): EditorState;
  export function editorToInput(state: EditorState): PostInput;
  /** Хадгалаагүй өөрчлөлт байна уу — admin.html-ийн `dirty` */
  export function isDirty(a: EditorState, b: EditorState): boolean;
  ```

- [ ] **Step 1: Write the failing tests** — `lib/editor-state.test.ts`

```ts
it("шинэ мэдээ өнөөдрийн огноотой, ноорог", () => {
  const s = emptyEditor("2026-11-27");
  expect(s.date).toBe("2026-11-27");
  expect(s.title).toBe("");
  expect(s.channels).toEqual(["Сайт", "Facebook", "YouTube"]); // admin.html-ийн `blank()`
  expect(s.motif).toBe("hemi");
});
it("мэдээнээс төлөв рүү, буцаад оролт руу эвдрэхгүй", () => {
  const s = editorFromPost(POST);
  expect(editorToInput(s).title).toBe(POST.title);
  expect(editorToInput(s).date).toBe("2026-11-20");
});
it("талбар солиход шинэ объект", () => {
  const a = emptyEditor("2026-11-27");
  const b = editorReducer(a, { type: "set", field: "title", value: "Шинэ" });
  expect(b.title).toBe("Шинэ");
  expect(a.title).toBe("");
});
it("хадгалаагүй өөрчлөлтийг мэднэ", () => {
  const a = emptyEditor("2026-11-27");
  expect(isDirty(a, a)).toBe(false);
  expect(isDirty(a, editorReducer(a, { type: "set", field: "title", value: "X" }))).toBe(true);
});
/** Шошго нь формд таслалтай мөр, санд массив */
it("шошгыг таслалаар задална, хоосныг хаяна", () => {
  const s = editorReducer(emptyEditor("2026-11-27"),
    { type: "set", field: "tagsText", value: "Төсөв, , Хууль ,Сонгууль" });
  expect(editorToInput(s).tags).toEqual(["Төсөв", "Хууль", "Сонгууль"]);
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement**

`[id]/page.tsx`: `requireStudio()` → `studioPost()` → олдохгүй бол `notFound()` → `<EditorForm>`-д дамжуулна. `new/page.tsx`: `canCreate(actor)` худал бол `/studio/news` руу `redirect`.

`editor-form.tsx` нь `useReducer`-ээр төлөв барина, `sectionsFor`-оос ирсэн хэсгүүдийг л зурна (бусдыг нь ОГТ зурахгүй — түгжсэн талбар нь дарж болохгүй товчтой адил). Хадгалах товч нь `trpc.studioNews.save.mutate(editorToInput(state))` дуудаад `router.refresh()`.

`flow-bar.tsx`: `FLOW`-ийн дөрвөн шат, одоогийнх нь тодорсон, `RETURNED` үед «↩ Буцаасан» ба хянагчийн тайлбар (`reviewNote`).

Хадгалаагүй өөрчлөлттэй үед хуудас орхиход сэрэмжлүүлэх: `beforeunload`.

- [ ] **Step 4: Run to verify they pass; open `/studio/news/new` and `/studio/news/<id>`**

Expected: шинэ хуудас хоосон формтой, байгаа мэдээ дээр утгууд нь дүүрсэн, урсгалын мөр зөв шатыг тодруулсан.

- [ ] **Step 5: Commit** — `feat(editor): the editor shell and its form state`

---

### Task 4: Үндсэн мэдээлэл

**Files:**
- Create: `apps/parliament-news/components/studio/editor/section-basic.tsx`
- Create: `apps/parliament-news/lib/autofix.ts`
- Create: `apps/parliament-news/lib/autofix.test.ts`

**Interfaces:**
- Produces:
  ```ts
  /** admin.html-ийн `autoFix` — зай, цэг таслал, хашилт */
  export function autoFix(text: string): string;
  ```

- [ ] **Step 1: Write the failing tests** — `lib/autofix.test.ts`

```ts
it("давхар зайг нэг болгоно", () => expect(autoFix("а  б")).toBe("а б"));
it("цэг таслалын өмнөх зайг хасна", () => expect(autoFix("а , б")).toBe("а, б"));
it("цэг таслалын дараа зай тавина", () => expect(autoFix("а,б")).toBe("а, б"));
it("монгол хашилт болгоно", () => expect(autoFix('"үг"')).toBe("«үг»"));
it("догол мөрийг ХАДГАЛНА", () => expect(autoFix("а\n\nб")).toBe("а\n\nб"));
it("мөрийн эхний зайг хасна", () => expect(autoFix("  а")).toBe("а"));
it("гурван цэгийг нэгтгэнэ", () => expect(autoFix("тэгээд...")).toBe("тэгээд…"));
```

- [ ] **Step 2: Run to verify they fail**
- [ ] **Step 3: Implement `autoFix`, then `section-basic.tsx`**

Талбарууд ба хязгаар (`admin.html:577-613`): гарчиг (160, `0/160` тоолуур), ангилал (`<select>`, `studioCategories`-аас), дэд ангилал (ангилал нь дэд ангилалтай үед л), огноо (`type="date"`), сурвалжлагч (60), нурууны богино гарчиг (40, «Гарчгаас автоматаар»), шошго (300, таслалаар), товч агуулга (300, тоолуур), дэлгэрэнгүй текст (8000).

`autoFix` нь `f_auto` чеклэгдсэн үед biet-ийн `onBlur` дээр ажиллана.

- [ ] **Step 4: Run to verify they pass**
- [ ] **Step 5: Commit** — `feat(editor): the basic section, with the artifact's limits`

---

### Task 5: Эх сурвалж

**Files:**
- Create: `apps/parliament-news/components/studio/editor/section-src.tsx`

- [ ] **Step 1: Implement**

Холбоосын жагсаалт: мөр нэмэх, устгах, дээш доош зөөх. Хязгаар 20 (Task 1-ийн схем барина). `type="url"`, `placeholder="https://parliament.mn/…"`.

- [ ] **Step 2: Verify** — `/studio/news/<id>` дээр холбоос нэмж хадгалаад дахин ачаалахад үлдсэн эсэх.
- [ ] **Step 3: Commit** — `feat(editor): the sources list`

---

### Task 6: Нийтлэх суваг, стори, төлөв

**Files:**
- Create: `apps/parliament-news/components/studio/editor/section-pub.tsx`

- [ ] **Step 1: Implement**

Сувгууд (`Сайт`, `Facebook`, `YouTube`, `Instagram`, `TikTok` — admin.html-ийн `CH`), сошиал постын текст (2200, тоолуур), «Онцлох», «Стори болгох» + хугацаа (`24 цаг` / `3 өдөр` / `7 хоног` / `Хугацаагүй` = 1/3/7/0), ба `canSetStatusManually(actor)` үед л төлөвийн `<select>`.

**Review Focus #5:** огноог ирээдүйд тавиад төлөвийг `PUBLISHED` болговол жагсаалт «Цаг товлосон» гэж харуулах ёстой (3a-ийн `postBadge`). Энэ хэсэг тэр хосыг зөв бичиж байгааг нүдээр шалгана.

- [ ] **Step 2: Verify** — ирээдүйн огноотой нийтлээд жагсаалтад «Цаг товлосон» гарах, нийтийн нүүрэнд ГАРАХГҮЙ байх.
- [ ] **Step 3: Commit** — `feat(editor): channels, stories and the manual status`

---

### Task 7: Хуулийн төсөл

**Files:**
- Create: `apps/parliament-news/components/studio/editor/section-bill.tsx`
- Modify: `apps/parliament-news/server/routers/studio-news.ts` (save нь `Bill` ба `BillStage`-ийг бичнэ)
- Modify: `apps/parliament-news/server/routers/studio-news.db.test.ts`

- [ ] **Step 1: Write the failing DB tests**

```ts
it("хуулийн төслийг үүсгэж, шатыг хадгална", async () => {
  await caller("LEGAL").studioNews.save({ id: ids.draft, billEnabled: true, billStage: 3,
    votesYes: 40, votesNo: 12, billSteps: STEPS, title: IGNORED, date: D });
  const bill = await prisma.bill.findFirst({ where: { postId: ids.draft }, include: { steps: true } });
  expect(bill?.stage).toBe(3);
  expect(bill?.votesYes).toBe(40);
  expect(bill?.steps).toHaveLength(5);
});
it("унтраавал төсөл устана", async () => {
  await caller("LEGAL").studioNews.save({ id: ids.withBill, billEnabled: false, title: IGNORED, date: D });
  expect(await prisma.bill.findFirst({ where: { postId: ids.withBill } })).toBeNull();
});
it("шат нь 0-4-ийн хооронд", async () => {
  await expect(caller("LEGAL").studioNews.save({ id: ids.draft, billEnabled: true, billStage: 9, title: IGNORED, date: D }))
    .rejects.toThrow();
});
```

- [ ] **Step 2: Run to verify they fail**
- [ ] **Step 3: Implement** — `BILL_STAGES` (`lib/bill-stages.ts`, 5 шат) -ийн сонголт, санал хураалтын тоо, шат бүрийн тайлбар.
- [ ] **Step 4: Run to verify they pass**
- [ ] **Step 5: Commit** — `feat(editor): the bill stages and the vote counts`

---

### Task 8: Амьд хавтасны урьдчилан харалт

**Files:**
- Create: `apps/parliament-news/components/studio/editor/cover-preview.tsx`
- Create: `apps/parliament-news/lib/editor-cover.ts`
- Create: `apps/parliament-news/lib/editor-cover.test.ts`

**Interfaces:**
- Consumes: `coverSvg`/`coverInner` (`lib/cover.ts`), `EditorState` (Task 3).
- Produces:
  ```ts
  /** Формын төлөвөөс хавтасны оролт руу */
  export function editorCoverInput(state: EditorState, imageUrl: string | null): CoverInput;
  ```

- [ ] **Step 1: Write the failing tests**

```ts
it("гарчиг, ангилал, огноо нь хавтас руу очно", () => {
  const c = editorCoverInput(STATE, null);
  expect(c.title).toBe(STATE.title);
  expect(c.categoryName).toBe(STATE.categoryName);
});
it("гарчиггүй үед орлуулагч текст — хоосон ном зурахгүй", () => {
  expect(editorCoverInput({ ...STATE, title: "" }, null).title).toBe("(гарчиггүй)");
});
it("эхний зураг нь хавтас болно", () => {
  expect(editorCoverInput(STATE, "https://b.mn/a.jpg").imageUrl).toBe("https://b.mn/a.jpg");
});
it("онцлохыг дамжуулна", () => {
  expect(editorCoverInput({ ...STATE, featured: true }, null).featured).toBe(true);
});
```

- [ ] **Step 2: Run to verify they fail**
- [ ] **Step 3: Implement**

`cover-preview.tsx` нь `coverInner()`-ийн гаргасан SVG-г `dangerouslySetInnerHTML`-ээр `<svg viewBox="0 0 474 900">` дотор тавина. **Хоёр дахь зурагч бичихгүй** — Global Constraints.

Нурууны урьдчилан харалтыг мөн (admin.html-ийн `drawSc`): нурууны богино гарчиг тэнд хэрхэн харагдахыг редактор шууд хараад 40 тэмдэгтийн хязгаарыг ойлгоно.

- [ ] **Step 4: Run to verify they pass; open the editor and type**

Expected: гарчиг бичих бүрт ном дээрх текст өөрчлөгдөнө.

- [ ] **Step 5: Commit** — `feat(editor): the live cover preview, drawn by lib/cover.ts`

---

### Task 9: Дизайн мастер

**Files:**
- Create: `apps/parliament-news/lib/look-presets.ts`
- Create: `apps/parliament-news/lib/look-presets.test.ts`
- Create: `apps/parliament-news/components/studio/editor/section-look.tsx`

**Interfaces:**
- Produces:
  ```ts
  export const LOOK_PRESETS: { name: string; theme: number; look: CoverLook }[];
  /** `cover.ts`-ийн дотоод `LAYOUTS`-тай нэр давхцахгүй байх тул `_CHOICES` */
  export const LAYOUT_CHOICES: { value: CoverLayout; label: string }[];
  export const FONT_CHOICES: { value: "sans" | "serif"; label: string }[];
  export const FOCUS_CHOICES: { value: number; label: string }[];
  export const SIZE_RANGE: { min: 80; max: 125; step: 5 };
  /** admin.html-ийн `MOTS` — `cover.ts` нь жагсаалт экспортлодоггүй */
  export const MOTIF_CHOICES: { value: Motif; label: string }[];
  /** Анхны байдал — admin.html-ийн `l_reset` */
  export function resetLook(): CoverLook;
  ```

- [ ] **Step 1: Write the failing tests**

```ts
it("artifact-ийн найман бэлэн загвар", () => {
  expect(LOOK_PRESETS.map((p) => p.name)).toEqual([
    "Брэнд цэнхэр", "Цаасан", "Улбар шар", "Шөнийн",
    "Төрийн далбаа", "Хар цагаан", "Мэдээллийн", "Тэнгэр",
  ]);
});
it("«Төрийн далбаа» нь улаан, шар", () => {
  const f = LOOK_PRESETS.find((p) => p.name === "Төрийн далбаа")!;
  expect(f.look).toEqual({ bg: "#C4272F", fg: "#FFFFFF", ac: "#F9CF02" });
  expect(f.theme).toBe(2);
});
it("«Мэдээллийн» нь serif, зөвхөн текст", () => {
  const n = LOOK_PRESETS.find((p) => p.name === "Мэдээллийн")!;
  expect(n.look.font).toBe("serif");
  expect(n.look.lay).toBe("text");
});
it("гурван зохиомж", () => {
  expect(LAYOUT_CHOICES.map((l) => l.value)).toEqual(["top", "full", "text"]);
  expect(LAYOUT_CHOICES.map((l) => l.label)).toEqual(["Зураг дээр", "Бүтэн зураг", "Зөвхөн текст"]);
});
it("artifact-ийн долоон хээ", () => {
  expect(MOTIF_CHOICES.map((m) => m.value)).toEqual(
    ["hemi", "cols", "bars", "rings", "sun", "wave", "grid"],
  );
  expect(MOTIF_CHOICES[0].label).toBe("УИХ-ын танхим (126 суудал)");
});
it("зургийн төвлөрөл нь 15/50/85", () => {
  expect(FOCUS_CHOICES.map((f) => f.value)).toEqual([15, 50, 85]);
});
it("анхны байдалд өнгө, зохиомж үлдэхгүй", () => {
  expect(resetLook()).toEqual({});
});
```

- [ ] **Step 2: Run to verify they fail**
- [ ] **Step 3: Implement** — `section-look.tsx`: бэлэн загварууд (жижиг ном болгон), гурван өнгөний сонгогч, зохиомж, фонт, хэмжээний гулсуур (`80-125%`), зургийн төвлөрөл, «брэндийн 2 өнгөөр будах», «Анхны байдалд», ба зураггүй үеийн хээний `<select>` (`MOTIF_CHOICES`).
- [ ] **Step 4: Run to verify they pass; change each control and watch the preview**
- [ ] **Step 5: Commit** — `feat(editor): the cover design master`

---

### Task 10: Зураг, видео байршуулах

**Files:**
- Create: `apps/parliament-news/lib/upload.ts`
- Create: `apps/parliament-news/lib/upload.test.ts`
- Create: `apps/parliament-news/app/api/upload/route.ts`
- Create: `apps/parliament-news/components/studio/editor/section-photos.tsx`
- Create: `apps/parliament-news/components/studio/editor/section-video.tsx`
- Modify: `apps/parliament-news/server/routers/studio-news.ts` (`attachMedia`, `removeMedia`, `reorderMedia`)
- Modify: `apps/parliament-news/package.json` (`@vercel/blob`)

**Interfaces:**
- Produces:
  ```ts
  export const IMAGE_TYPES: string[];  // image/jpeg, image/png, image/webp, image/avif
  export const VIDEO_TYPES: string[];  // video/mp4, video/webm
  export const IMAGE_MAX = 8 * 1024 * 1024;
  export const VIDEO_MAX = 200 * 1024 * 1024;
  export function checkUpload(file: { type: string; size: number }, kind: "image" | "video"):
    { ok: true } | { ok: false; reason: string };
  ```

- [ ] **Step 1: Write the failing tests** — `lib/upload.test.ts`

```ts
/** Review Focus #4 */
it("SVG-г ТАТГАЛЗАНА — blob домэйнаас script ажиллуулна", () => {
  expect(checkUpload({ type: "image/svg+xml", size: 100 }, "image").ok).toBe(false);
});
it("HTML-ийг татгалзана", () => {
  expect(checkUpload({ type: "text/html", size: 100 }, "image").ok).toBe(false);
});
it("төрлийг хуурахыг оролдвол", () => {
  expect(checkUpload({ type: "", size: 100 }, "image").ok).toBe(false);
});
it("зөв зургийг авна", () => {
  expect(checkUpload({ type: "image/jpeg", size: 1000 }, "image").ok).toBe(true);
});
it("хэт том зургийг татгалзана", () => {
  expect(checkUpload({ type: "image/jpeg", size: IMAGE_MAX + 1 }, "image").ok).toBe(false);
});
it("видеог зургийн суваг руу оруулахгүй", () => {
  expect(checkUpload({ type: "video/mp4", size: 1000 }, "image").ok).toBe(false);
});
it("шалтгааныг монголоор хэлнэ", () => {
  const r = checkUpload({ type: "image/svg+xml", size: 1 }, "image");
  expect(r.ok === false && /зөвшөөрөгдөхгүй/.test(r.reason)).toBe(true);
});
```

- [ ] **Step 2: Run to verify they fail**
- [ ] **Step 3: Implement**

`app/api/upload/route.ts` нь `@vercel/blob/client`-ийн `handleUpload`: `onBeforeGenerateToken`-д **`studioSession()`-ээр эрхийг шалгана** (нэвтрээгүй хүн токен авч болохгүй) ба `allowedContentTypes`, `maximumSizeInBytes`-ийг `lib/upload.ts`-ээс. `addRandomSuffix: true`.

`attachMedia({ postId, url, kind, caption })` нь `sectionsFor`-оор `photos`/`video` хэсгийг шалгана.

`section-photos.tsx`: байршуулах, дараалал солих (эхнийх нь хавтас болно гэдгийг ХЭЛНЭ), тайлбар бичих, устгах. `section-video.tsx`: ганц видео.

- [ ] **Step 4: Run to verify they pass; upload a real photo and watch it become the cover**
- [ ] **Step 5: Commit** — `feat(editor): photo and video uploads, type and size checked on the server`

---

### Task 11: Баримтжуулалт ба бүх шалгалт

**Files:**
- Modify: `apps/parliament-news/README.md`
- Modify: `apps/parliament-news/scripts/browser-check.mjs`
- Modify: `apps/parliament-news/lib/readme-studio.test.ts`

- [ ] **Step 1: README — засварлагчийн хэсэг**

Талбарууд ба хязгаар, хавтасны дизайн мастер, байршуулалтын хязгаарлалт (төрөл, хэмжээ), slug солиход юу болох, зэрэг засварлалтын зан төлөв, ба ЗАГВАР ДУУДСАН боломжууд ороогүй гэдгийг шалтгаантай нь.

- [ ] **Step 2: browser-check-д засварлагчийн шалгуур**

`E1` шинэ мэдээний форм нээгдэнэ · `E2` гарчиг бичихэд хавтас өөрчлөгдөнө · `E3` бэлэн загвар дарахад өнгө солигдоно · `E4` хадгалаад дахин ачаалахад утга үлдэнэ.

- [ ] **Step 3: readme-studio.test.ts-д шинэ батламж** — хязгаарууд README-д байгаа эсэх.

- [ ] **Step 4: Бүх шалгалт**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build && pnpm check:browser`
Expected: бүгд PASS. Нийтийн 24 шалгуур хэвээр ногоон — засварлагч тэдгээрийг хөндөх ёсгүй.

- [ ] **Step 5: Commit** — `docs(editor): the fields, the limits and what is not included`

---

## Дууссаны дараа

Бүтэн branch-ийн хяналт, дараа нь `superpowers:finishing-a-development-branch`.

**Энэ төлөвлөгөөнд ОРООГҮЙ — 3c:**
- **Тохиргоо** (`/studio/settings`): ирц, өнөөдрийн хөтөлбөр, «ШУУД» мөр, гүйдэг зар, толгой/хөл. `LIVE` үүргийн БҮХ ажил — одоогоор тэр үүрэг хийх зүйлгүй.
- **Зургийн сан**, **сэтгэгдэл**, **баг ба эрх** (`TenantMember` удирдах), **самбар**.
- **Загвар дуудсан туслах** — Anthropic API-ийн түлхүүр, төлбөрийн шийдвэр шаардана.
