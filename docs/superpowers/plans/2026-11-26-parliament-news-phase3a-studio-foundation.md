# Parliament News 3a — редакцын студийн суурь

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Редакц нэвтэрч, мэдээ үүсгэж, 5 төлөвт урсгалаар дамжуулж нийтлэх боломжтой болох — эрх бүр сервер талд шалгагдсан байдлаар.

**Architecture:** Эрхийн шийдвэрүүд нь `lib/permissions.ts`-д ЦЭВЭР функц, UI ба tRPC хоёулаа түүнийг дууддаг — UI-д товч нуух нь хамгаалалт биш. Студи нь `app/(studio)/studio/`-д, `middleware.ts` аль хэдийн хаалгалсан. Бичих үйлдэл бүр tRPC-ийн `editorialProcedure`-ээр явж, `NewsActivity`-д мөр үлдээнэ.

**Tech Stack:** Next.js 14 App Router (RSC + server actions-гүй, tRPC), NextAuth (credentials, JWT), Prisma 5, vitest 2, Tailwind + artifact-ийн CSS.

**Spec:** `docs/superpowers/specs/2026-11-25-parliament-news-platform-design.md` — §5.4 (эрх), §6-ийн 3-р алхам (редакцын систем). Дизайны эх сурвалж: `apps/parliament-news/site-v2/admin.html`.

## Global Constraints

- Схемд ӨӨРЧЛӨЛТ ОРУУЛАХГҮЙ. `NewsPost`, `TenantMember`, `NewsActivity`, `NewsRole`, `NewsStatus` бүгд бэлэн. `prisma db push` ажиллуулахгүй, `migrate dev` хэзээ ч биш.
- Нууц үг кодод, лог-д, тестэд ХЭЗЭЭ Ч бичигдэхгүй. Seed нь үүсгэсэн нууц үгийг терминалд НЭГ удаа хэвлэнэ.
- `eslint-disable` коммент бичихгүй — репогийн eslintrc нь plugin-ийн дүрмүүдийг ачаалдаггүй тул тохируулаагүй дүрмийг нэрлэсэн коммент өөрөө `next build`-ийг унагана.
- `next dev` ажиллаж байхад `next build` хийхгүй — `.next` түгжигдэж, бүх динамик зам 500 буцаана.
- Эрхийн 10 үүрэг ба тэдгээрийн хэсгүүд `site-v2/admin.html:844-886`-аас ЯГ хэвээр. Нэр, монгол тайлбар, дүрэм өөрчлөхгүй.
- Бичих tRPC procedure бүр `editorialProcedure`-ээс эхэлж, `lib/permissions.ts`-ийн шалгалт дамжина. Шалгалтгүй мутаци байж болохгүй.

## Review Focus

1. **Эрхгүй хэрэглэгч шууд URL-аар орох.** `middleware` нь зөвхөн нэвтэрсэн эсэхийг шалгана — `TenantMember`-гүй хэрэглэгч `/studio/news` рүү орвол хуудас өгөгдөл ХАРУУЛАХГҮЙ, 403 эсвэл нэвтрэх рүү буцаана. → Task 2, 5.
2. **Эрх нь UI-д нуугдсан боловч мутаци нээлттэй.** `analyst` нь `publish` мутацийг гараар дуудвал FORBIDDEN авна. Task 7-ийн тест үүрэг бүрээр үйлдэл бүрийг шалгана.
3. **Өөрийнх биш мэдээ.** `reporter` нь өөр хүний ноорогийг засах, устгах, илгээх боломжгүй — `own(n)` нь `createdBy == uid`, бидэнд `authorId`. → Task 1, 7.
4. **Төлөв буруу шилжих.** `approve` нь зөвхөн `REVIEW`-ээс, `unpublish` нь зөвхөн `PUBLISHED`-ээс. Урсгалаас гарсан шилжилт FORBIDDEN. → Task 1, 7.
5. **Нийтлэсэн мэдээ нийтийн хуудсанд шууд гарахгүй.** `revalidate = 300` тул нийтлэх үйлдэл `revalidatePath` дуудах ёстой; үгүй бол редактор «нийтэллээ» гэж харсан ч сайт дээр 5 минут гарахгүй. → Task 7.

---

### Task 1: Эрхийн модуль

Бүх эрхийн шийдвэр НЭГ цэвэр файлд. UI ба сервер хоёулаа үүнийг дуудна.

**Files:**
- Create: `apps/parliament-news/lib/permissions.ts`
- Create: `apps/parliament-news/lib/permissions.test.ts`

**Interfaces:**
- Consumes: `NewsRole`, `NewsStatus` (`@nuul/db-news`).
- Produces:
  ```ts
  export type Section = "basic" | "photos" | "video" | "bill" | "src" | "look" | "pub";
  export type WorkflowAction = "submit" | "approve" | "return" | "publish" | "unpublish";
  export type PostRef = { id: string | null; status: NewsStatus; authorId: string | null };
  export type Actor = { userId: string; role: NewsRole };

  export const ROLE_LABELS: Record<NewsRole, { name: string; about: string }>;
  export const SECTIONS: Record<NewsRole, Section[]>;
  export const ACTION_STATUS: Record<WorkflowAction, NewsStatus>;
  export const FLOW: { status: NewsStatus; label: string }[];

  export function sectionsFor(actor: Actor, post: PostRef): Section[];
  export function canEditSection(actor: Actor, post: PostRef, section: Section): boolean;
  export function canCreate(actor: Actor): boolean;
  export function canDelete(actor: Actor, post: PostRef): boolean;
  export function canAct(actor: Actor, post: PostRef, action: WorkflowAction): boolean;
  export function canSetStatusManually(actor: Actor): boolean;
  ```

- [ ] **Step 1: Write the failing tests** — `lib/permissions.test.ts`

`admin.html:844-886`-ийн дүрмүүдийг яг хуулна. Хамгийн багадаа:

```ts
const act = (role: NewsRole, userId = "u1"): Actor => ({ userId, role });
const post = (p: Partial<PostRef> = {}): PostRef =>
  ({ id: "p1", status: "DRAFT", authorId: "u1", ...p });

describe("SECTIONS", () => {
  it("artifact-ийн хүснэгтээр", () => {
    expect(SECTIONS.SUPER).toEqual(["basic","photos","video","bill","src","look","pub"]);
    expect(SECTIONS.REPORTER).toEqual(["basic","photos","video","bill","src","look"]);
    expect(SECTIONS.CONTRIBUTOR).toEqual(["basic","src","look"]);
    expect(SECTIONS.MEDIA).toEqual(["photos","video"]);
    expect(SECTIONS.LEGAL).toEqual(["bill","src"]);
    expect(SECTIONS.SOCIAL).toEqual(["pub"]);
    expect(SECTIONS.LIVE).toEqual([]);
    expect(SECTIONS.ANALYST).toEqual([]);
  });
});

describe("sectionsFor", () => {
  it("сэтгүүлч зөвхөн ӨӨРИЙН ноорог, буцаасныг засна", () => {
    expect(sectionsFor(act("REPORTER"), post({ status: "DRAFT" }))).toHaveLength(6);
    expect(sectionsFor(act("REPORTER"), post({ status: "RETURNED" }))).toHaveLength(6);
    expect(sectionsFor(act("REPORTER"), post({ status: "REVIEW" }))).toEqual([]);
    expect(sectionsFor(act("REPORTER"), post({ authorId: "u2" }))).toEqual([]);
  });
  it("шинэ мэдээ (id null) нь өөрийнх гэж тооцогдоно", () => {
    expect(sectionsFor(act("REPORTER"), post({ id: null, authorId: null }))).toHaveLength(6);
  });
  it("хянагч зөвхөн хянагдаж буй, батлагдсаныг — шинийг мөн", () => {
    expect(sectionsFor(act("REVIEWER"), post({ status: "REVIEW" }))).toHaveLength(7);
    expect(sectionsFor(act("REVIEWER"), post({ status: "DRAFT" }))).toEqual([]);
    expect(sectionsFor(act("REVIEWER"), post({ id: null, status: "DRAFT" }))).toHaveLength(7);
  });
  it("медиа редактор нийтлэгдсэн мэдээнд хүрэхгүй", () => {
    expect(sectionsFor(act("MEDIA"), post({ status: "APPROVED" }))).toEqual(["photos","video"]);
    expect(sectionsFor(act("MEDIA"), post({ status: "PUBLISHED" }))).toEqual([]);
  });
  it("шинжээч юу ч засахгүй", () => {
    expect(sectionsFor(act("ANALYST"), post())).toEqual([]);
  });
});

describe("canAct", () => {
  it("submit: ноорог/буцаасан дээр, өөрийнх эсвэл ахлах", () => {
    expect(canAct(act("REPORTER"), post({ status: "DRAFT" }), "submit")).toBe(true);
    expect(canAct(act("REPORTER"), post({ status: "REVIEW" }), "submit")).toBe(false);
    expect(canAct(act("REPORTER"), post({ authorId: "u2" }), "submit")).toBe(false);
    expect(canAct(act("CHIEF"), post({ authorId: "u2" }), "submit")).toBe(true);
    expect(canAct(act("MEDIA"), post(), "submit")).toBe(false);
  });
  it("approve: зөвхөн хянагдаж буйгаас, хянагч дээш", () => {
    expect(canAct(act("REVIEWER"), post({ status: "REVIEW" }), "approve")).toBe(true);
    expect(canAct(act("REVIEWER"), post({ status: "DRAFT" }), "approve")).toBe(false);
    expect(canAct(act("REPORTER"), post({ status: "REVIEW" }), "approve")).toBe(false);
  });
  it("return: хянагдаж буй ба батлагдсанаас", () => {
    expect(canAct(act("REVIEWER"), post({ status: "APPROVED" }), "return")).toBe(true);
    expect(canAct(act("REVIEWER"), post({ status: "PUBLISHED" }), "return")).toBe(false);
  });
  it("publish: зөвхөн ахлах, нийтлэгдээгүй бол", () => {
    expect(canAct(act("CHIEF"), post({ status: "APPROVED" }), "publish")).toBe(true);
    expect(canAct(act("CHIEF"), post({ status: "DRAFT" }), "publish")).toBe(true);
    expect(canAct(act("CHIEF"), post({ status: "PUBLISHED" }), "publish")).toBe(false);
    expect(canAct(act("REVIEWER"), post({ status: "APPROVED" }), "publish")).toBe(false);
  });
  it("unpublish: зөвхөн нийтлэгдсэнээс, ахлах", () => {
    expect(canAct(act("CHIEF"), post({ status: "PUBLISHED" }), "unpublish")).toBe(true);
    expect(canAct(act("CHIEF"), post({ status: "DRAFT" }), "unpublish")).toBe(false);
  });
  it("бүх үүрэг, бүх үйлдэл — шинжээч юу ч хийхгүй", () => {
    for (const a of ["submit","approve","return","publish","unpublish"] as WorkflowAction[]) {
      expect(canAct(act("ANALYST"), post({ status: "REVIEW" }), a)).toBe(false);
      expect(canAct(act("LIVE"), post({ status: "REVIEW" }), a)).toBe(false);
    }
  });
});

describe("canDelete / canCreate", () => {
  it("устгах: ахлах бүгдийг, сэтгүүлч зөвхөн өөрийн хадгалсан ноорог", () => {
    expect(canDelete(act("CHIEF"), post({ authorId: "u2", status: "PUBLISHED" }))).toBe(true);
    expect(canDelete(act("REPORTER"), post({ status: "DRAFT" }))).toBe(true);
    expect(canDelete(act("REPORTER"), post({ status: "REVIEW" }))).toBe(false);
    expect(canDelete(act("REPORTER"), post({ authorId: "u2" }))).toBe(false);
    expect(canDelete(act("REPORTER"), post({ id: null }))).toBe(false);
  });
  it("үүсгэх: таван үүрэг", () => {
    for (const r of ["SUPER","CHIEF","REVIEWER","REPORTER","CONTRIBUTOR"] as NewsRole[]) {
      expect(canCreate(act(r))).toBe(true);
    }
    for (const r of ["MEDIA","LEGAL","SOCIAL","LIVE","ANALYST"] as NewsRole[]) {
      expect(canCreate(act(r))).toBe(false);
    }
  });
});

describe("ACTION_STATUS", () => {
  it("artifact-ийн NS хүснэгт", () => {
    expect(ACTION_STATUS).toEqual({
      submit: "REVIEW", approve: "APPROVED", return: "RETURNED",
      publish: "PUBLISHED", unpublish: "DRAFT",
    });
  });
});

describe("canSetStatusManually", () => {
  it("зөвхөн супер админ", () => {
    expect(canSetStatusManually(act("SUPER"))).toBe(true);
    expect(canSetStatusManually(act("CHIEF"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/permissions.test.ts`
Expected: FAIL — модуль байхгүй

- [ ] **Step 3: Implement `lib/permissions.ts`**

`ROLE_LABELS`-ийн монгол нэр, тайлбарыг `admin.html`-ийн `ROLES`-оос ЯГ хуулна (`super: 'Супер админ'` … `analyst: 'Шинжээч'`). `SECTIONS`-ийн түлхүүр нь `NewsRole` enum (ТОМ үсгээр), утга нь artifact-ийн `SECS`. `own(post, actor)` нь `post.id === null || post.authorId === actor.userId`.

- [ ] **Step 4: Run to verify they pass** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/parliament-news/lib/permissions.ts apps/parliament-news/lib/permissions.test.ts
git commit -m "feat(studio): the editorial permission table, as a tested module"
```

---

### Task 2: Студийн сесс — хэрэглэгчээс үүрэг рүү

**Files:**
- Create: `apps/parliament-news/lib/studio-session.ts`
- Create: `apps/parliament-news/lib/studio-session.db.test.ts`

**Interfaces:**
- Consumes: `getNewsRole` (`lib/trpc.ts`), `requireTenant` (`lib/tenant.ts`), `authOptions` (`lib/auth.ts`), `Actor` (Task 1).
- Produces:
  ```ts
  export type StudioSession = { actor: Actor; tenantId: string; name: string | null; email: string };
  /** Эрхгүй бол null — дуудагч нь redirect эсвэл 403-ыг шийднэ */
  export function studioSession(): Promise<StudioSession | null>;
  /** Эрхгүй бол /studio/signin рүү шиднэ */
  export function requireStudio(): Promise<StudioSession>;
  ```

- [ ] **Step 1: Write the failing DB test** — `lib/studio-session.db.test.ts`

`beforeAll`-д жинхэнэ tenant дотор түр `User` (bcrypt hash-тай) ба `TenantMember` үүсгэнэ. `afterAll`-д устгана, tenant-ыг УСТГАХГҮЙ.

```ts
it("идэвхгүй гишүүн эрхгүй", async () => {
  await prisma.tenantMember.update({ where: { tenantId_userId: { tenantId, userId } }, data: { active: false } });
  expect(await getNewsRole(tenantId, userId)).toBeNull();
});
it("гишүүн биш хэрэглэгч эрхгүй", async () => {
  expect(await getNewsRole(tenantId, outsiderId)).toBeNull();
});
it("идэвхтэй гишүүн үүрэгтэй", async () => {
  expect(await getNewsRole(tenantId, userId)).toBe("REPORTER");
});
```

**Review Focus #1:** эдгээр нь «нэвтэрсэн ≠ эрхтэй» гэдгийг барина.

- [ ] **Step 2: Run to verify they fail** — модуль байхгүй

- [ ] **Step 3: Implement `lib/studio-session.ts`**

`getServerSession(authOptions)` → `requireTenant()` → `getNewsRole()`. Гурвын аль нэг нь хоосон бол `null`. `requireStudio()` нь `redirect("/studio/signin")`.

- [ ] **Step 4: Run to verify they pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(studio): resolve a signed-in user to an editorial role"
```

---

### Task 3: Редакцын хэрэглэгч үүсгэх

Нэвтрэх хуудсыг шалгах хүн хэрэгтэй — тиймээс формоос ӨМНӨ.

**Files:**
- Create: `packages/db-news/prisma/seed-member.ts`
- Modify: `packages/db-news/package.json`

- [ ] **Step 1: Implement `seed-member.ts`**

`User` ба `TenantMember`-ийг үүсгэнэ эсвэл шинэчилнэ. Имэйл, үүрэг, нэрийг env-ээс:
`MEMBER_EMAIL` (заавал), `MEMBER_ROLE` (анхдагч `SUPER`), `MEMBER_NAME`.
`MEMBER_ROLE` нь `NewsRole`-д байхгүй бол шидэж зогсоно.

Нууц үг: `crypto.randomBytes(12).toString("base64url")` — үүсгээд `bcryptjs`-ийн
hash-аар хадгална, ЦЭВЭР хэлбэрээр нь **терминалд нэг удаа** хэвлэнэ. Кодод,
санд, лог файлд бичигдэхгүй. `MEMBER_PASSWORD` env өгөгдсөн бол түүнийг
хэрэглэж, юу ч хэвлэхгүй.

Хэрэглэгч аль хэдийн байвал нууц үгийг ДАРЖ БИЧИХГҮЙ — зөвхөн үүрэг, нэрийг
шинэчилж, «нууц үг хэвээр» гэж хэвлэнэ. Эс бөгөөс үүрэг солих болгонд хүний
нууц үг чимээгүй солигдоно.

- [ ] **Step 2: Add the script to `packages/db-news/package.json`**

```json
"db:seed:member": "dotenv -e ../../.env -- tsx prisma/seed-member.ts"
```

- [ ] **Step 3: Run it twice**

Run: `cd packages/db-news && MEMBER_EMAIL=<редакцын имэйл> pnpm db:seed:member`
Expected: 1-рт үүрэг ба нэг удаагийн нууц үг хэвлэгдэнэ; 2-рт «нууц үг хэвээр»
гэж хэвлэгдэж, ШИНЭ нууц үг гарахгүй.

- [ ] **Step 4: Typecheck**

Run: `cd packages/db-news && pnpm typecheck`
Expected: алдаагүй

- [ ] **Step 5: Commit**

```bash
git add packages/db-news/prisma/seed-member.ts packages/db-news/package.json
git commit -m "feat(studio): seed an editorial member"
```

---

### Task 4: Нэвтрэх хуудас

**Files:**
- Create: `apps/parliament-news/app/(studio)/studio/signin/page.tsx`
- Create: `apps/parliament-news/components/studio/signin-form.tsx` (`"use client"`)
- Create: `apps/parliament-news/lib/signin.ts`
- Create: `apps/parliament-news/lib/signin.test.ts`

**Interfaces:**
- Produces:
  ```ts
  /** Нээлттэй дахин чиглүүлэлтээс хамгаална: зөвхөн /studio-ийн доторх зам */
  export function safeCallbackUrl(raw: string | null | undefined): string;
  export const SIGNIN_DEFAULT = "/studio/news";
  ```

- [ ] **Step 1: Write the failing tests** — `lib/signin.test.ts`

```ts
it("студийн зам хэвээр", () => {
  expect(safeCallbackUrl("/studio/news?status=review")).toBe("/studio/news?status=review");
});
it("гадны хаяг руу явуулахгүй", () => {
  expect(safeCallbackUrl("https://evil.mn/x")).toBe(SIGNIN_DEFAULT);
  expect(safeCallbackUrl("//evil.mn/x")).toBe(SIGNIN_DEFAULT);
  expect(safeCallbackUrl("/news/aliv")).toBe(SIGNIN_DEFAULT);
});
it("нэвтрэх хуудас руу гогцоо үүсгэхгүй", () => {
  expect(safeCallbackUrl("/studio/signin")).toBe(SIGNIN_DEFAULT);
});
it("хоосон бол анхдагч", () => {
  expect(safeCallbackUrl(null)).toBe(SIGNIN_DEFAULT);
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement**

`safeCallbackUrl`: `/studio/`-оор эхэлсэн, `//`-оор эхлээгүй, `/studio/signin`-д хүрээгүй бол хэвээр; үгүй бол `SIGNIN_DEFAULT`.

`signin-form.tsx`: `signIn("credentials", { email, password, redirect: false, callbackUrl })`. Алдаанд `authOptions`-ийн монгол мессежийг харуулна. Нууц үгийг хаана ч лог хийхгүй. `autoComplete="current-password"`, талбар хоёулаа `required`.

`page.tsx`: серверийн компонент, `searchParams.callbackUrl`-ийг `safeCallbackUrl`-ээр цэвэрлээд формд дамжуулна. Аль хэдийн нэвтэрсэн ба эрхтэй бол `redirect(callbackUrl)`.

- [ ] **Step 4: Run tests, then open `/studio/signin` and sign in with the seeded user (Task 3)**

Expected: буруу нууц үгэнд «Имэйл эсвэл нууц үг буруу байна», зөв дээр `/studio/news` рүү.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(studio): sign-in page"
```

---

### Task 5: Студийн бүрхүүл

**Files:**
- Create: `apps/parliament-news/app/(studio)/layout.tsx`
- Create: `apps/parliament-news/app/(studio)/studio/page.tsx`
- Create: `apps/parliament-news/components/studio/studio-nav.tsx`
- Create: `apps/parliament-news/lib/studio-nav.ts`
- Create: `apps/parliament-news/lib/studio-nav.test.ts`

**Interfaces:**
- Consumes: `Actor`, `canCreate` (Task 1), `requireStudio` (Task 2).
- Produces:
  ```ts
  export type NavItem = { href: string; label: string };
  export function navFor(actor: Actor): NavItem[];
  ```

- [ ] **Step 1: Write the failing tests** — `lib/studio-nav.test.ts`

```ts
it("шинжээч зөвхөн жагсаалт харна", () => {
  expect(navFor({ userId: "u", role: "ANALYST" }).map((i) => i.href)).toEqual(["/studio/news"]);
});
it("супер админ бүх холбоостой", () => {
  const hrefs = navFor({ userId: "u", role: "SUPER" }).map((i) => i.href);
  expect(hrefs).toContain("/studio/news");
  expect(hrefs).toContain("/studio/news/new");
});
it("медиа редактор шинэ мэдээ үүсгэхгүй", () => {
  expect(navFor({ userId: "u", role: "MEDIA" }).map((i) => i.href)).not.toContain("/studio/news/new");
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement**

`(studio)` route group нь нийтийн `layout.tsx`-аас ТУСДАА: студид hero, гүйдэг мөр, artifact-ийн хөл хэрэггүй. Өөрийн `<html>`/`<body>` гаргана (route group-ийн root layout), фонтын хувьсагчдыг ижил байдлаар тавина.

`layout.tsx`: `requireStudio()` → хэрэглэгчийн нэр, үүргийн шошго (`ROLE_LABELS`), `navFor()`-ийн холбоосууд, гарах товч (`signOut`). Эрхгүй бол `requireStudio` өөрөө чиглүүлнэ.

`studio/page.tsx`: `redirect("/studio/news")`.

**Review Focus #1:** `TenantMember`-гүй хэрэглэгч `/studio` руу орвол энд таслагдана, middleware-д биш.

- [ ] **Step 4: Run tests; open `/studio` as the seeded user**

Expected: `/studio/news` рүү, толгойд нэр ба үүргийн шошго.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(studio): the studio shell, with navigation by role"
```

---

### Task 6: Мэдээний жагсаалт

**Files:**
- Create: `apps/parliament-news/app/(studio)/studio/news/page.tsx`
- Create: `apps/parliament-news/lib/studio-posts.ts`
- Create: `apps/parliament-news/lib/studio-posts.db.test.ts`
- Create: `apps/parliament-news/components/studio/post-row.tsx`

**Interfaces:**
- Consumes: `Actor` (Task 1), `forTenant` (`lib/tenant-db.ts`).
- Produces:
  ```ts
  export type StudioFilter = { status?: NewsStatus | "all"; q?: string; mine?: boolean };
  export type StudioPost = {
    id: string; slug: string; title: string; status: NewsStatus;
    categoryName: string | null; authorId: string | null; authorName: string | null;
    date: Date; updatedAt: Date; publishedAt: Date | null;
  };
  export function studioPosts(actor: Actor, filter: StudioFilter): Promise<StudioPost[]>;
  export function studioCounts(actor: Actor): Promise<Record<NewsStatus, number>>;
  ```

**Чухал:** нийтийн `publishedWhere()` ЭНД ХЭРЭГЛЭХГҮЙ — редакц нь ноорог, хянагдаж буйг харах ёстой. Гэхдээ `forTenant` нь хэвээр.

- [ ] **Step 1: Write the failing DB tests**

```ts
it("ноорог, хянагдаж буй мэдээг ХАРУУЛНА — нийтийн хаалга энд биш", async () => {
  const slugs = (await studioPosts(chief, {})).map((p) => p.slug);
  expect(slugs).toContain(S.draft);
  expect(slugs).toContain(S.review);
});
it("төлөвөөр шүүнэ", async () => {
  const rows = await studioPosts(chief, { status: "REVIEW" });
  expect(rows.every((r) => r.status === "REVIEW")).toBe(true);
});
it("«зөвхөн минийх» нь бусдын мэдээг хасна", async () => {
  const rows = await studioPosts(reporter, { mine: true });
  expect(rows.every((r) => r.authorId === reporter.userId)).toBe(true);
});
it("гарчгаар хайна, орлуулагч зугтаана", async () => {
  expect(await studioPosts(chief, { q: "%" })).toHaveLength(0);
});
it("төлөв бүрийн тоо", async () => {
  const counts = await studioCounts(chief);
  expect(counts.DRAFT).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement**

`escapeLike` (`lib/posts.ts`-ээс экспортлогдсон) нь хайлтад. Эрэмбэ: `updatedAt desc`. `take: 100`.

`page.tsx`: `requireStudio()` → `searchParams`-аас шүүлт → хүснэгт. Төлөв бүрийн тоог дээр нь чипээр. `canCreate(actor)` бол «Шинэ мэдээ» товч.

- [ ] **Step 4: Run to verify they pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(studio): the article list, with status filters"
```

---

### Task 7: Урсгалын мутацууд

Энэ бол аюулгүй байдлын гол даалгавар. Товч нуух нь хамгаалалт биш.

**Files:**
- Create: `apps/parliament-news/server/routers/studio-news.ts`
- Modify: `apps/parliament-news/server/routers/index.ts`
- Create: `apps/parliament-news/lib/activity.ts`
- Create: `apps/parliament-news/server/routers/studio-news.db.test.ts`
- Create: `apps/parliament-news/server/routers/studio-news.test.ts`

**Interfaces:**
- Consumes: `editorialProcedure`, `Ctx` (`lib/trpc.ts`); `canAct`, `canDelete`, `canCreate`, `ACTION_STATUS`, `canSetStatusManually` (Task 1).
- Produces:
  ```ts
  // tRPC
  studioNews.act({ id: string; action: WorkflowAction; note?: string })  // → { status: NewsStatus }
  studioNews.remove({ id: string })                                      // → { ok: true }
  /** NewsActivity-д мөр. Бичих үйлдэл бүр дуудна. */
  export function logActivity(db: TenantClient, input: {
    tenantId: string; postId: string | null; userId: string; action: string; note?: string;
  }): Promise<void>;
  ```

- [ ] **Step 1: Write the failing DB tests**

Үүрэг бүрээр үйлдэл бүрийг шалгана — `lib/permissions.ts`-ийн матрицыг СЕРВЕР талд давтаж баталгаажуулна:

```ts
it("шинжээч нийтлэх гэвэл FORBIDDEN", async () => {
  await expect(caller("ANALYST").studioNews.act({ id, action: "publish" }))
    .rejects.toThrow(/FORBIDDEN|эрх/);
});
it("хянагч нийтлэхгүй", async () => {
  await expect(caller("REVIEWER").studioNews.act({ id: approvedId, action: "publish" }))
    .rejects.toThrow(/FORBIDDEN|эрх/);
});
it("сэтгүүлч бусдын мэдээг илгээхгүй", async () => {
  await expect(caller("REPORTER", "other").studioNews.act({ id: draftId, action: "submit" }))
    .rejects.toThrow(/FORBIDDEN|эрх/);
});
it("approve нь зөвхөн REVIEW-ээс", async () => {
  await expect(caller("CHIEF").studioNews.act({ id: draftId, action: "approve" }))
    .rejects.toThrow(/FORBIDDEN|эрх/);
});
it("нийтлэхэд publishedAt тавигдана", async () => {
  await caller("CHIEF").studioNews.act({ id: approvedId, action: "publish" });
  const row = await prisma.newsPost.findUnique({ where: { id: approvedId } });
  expect(row?.status).toBe("PUBLISHED");
  expect(row?.publishedAt).toBeInstanceOf(Date);
});
it("буулгахад publishedAt цэвэрлэгдэнэ — мэдээ нийтийн жагсаалтад үлдэхгүй", async () => {
  await caller("CHIEF").studioNews.act({ id: publishedId, action: "unpublish" });
  const row = await prisma.newsPost.findUnique({ where: { id: publishedId } });
  expect(row?.status).toBe("DRAFT");
  expect(row?.publishedAt).toBeNull();
});
it("үйлдэл бүр бүртгэлд мөр үлдээнэ", async () => {
  const before = await prisma.newsActivity.count({ where: { postId: draftId } });
  await caller("REPORTER").studioNews.act({ id: draftId, action: "submit" });
  expect(await prisma.newsActivity.count({ where: { postId: draftId } })).toBe(before + 1);
});
it("буцаах тайлбар бүртгэлд хадгалагдана", async () => {
  await caller("REVIEWER").studioNews.act({ id: reviewId, action: "return", note: "Эх сурвалж дутуу" });
  const last = await prisma.newsActivity.findFirst({
    where: { postId: reviewId }, orderBy: { createdAt: "desc" },
  });
  expect(last?.note).toBe("Эх сурвалж дутуу");
});
it("өөр tenant-ийн мэдээнд хүрэхгүй", async () => {
  await expect(caller("SUPER").studioNews.act({ id: foreignId, action: "publish" }))
    .rejects.toThrow();
});
```

Нийтлэх нь кэшийг хүчингүй болгохыг ТУСАД нь (`next/cache`-ийг mock-лон)
`server/routers/studio-news.test.ts`-д:

```ts
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
it("нийтлэхэд нүүр ба нийтлэлийн зам шинэчлэгдэнэ", async () => {
  await caller("CHIEF").studioNews.act({ id: approvedId, action: "publish" });
  expect(revalidatePath).toHaveBeenCalledWith("/");
  expect(revalidatePath).toHaveBeenCalledWith(`/news/${slug}`);
});
it("буулгахад ч шинэчлэгдэнэ", async () => {
  await caller("CHIEF").studioNews.act({ id: publishedId, action: "unpublish" });
  expect(revalidatePath).toHaveBeenCalledWith("/");
});
```

**Review Focus #2, #3, #4** — энэ блок тэднийг барина.

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement `server/routers/studio-news.ts`**

`act` процедур: `editorialProcedure` → мэдээг `ctx.db`-ээр уншина (олдохгүй бол `NOT_FOUND`) → `canAct(actor, postRef, action)` худал бол `FORBIDDEN` → `ACTION_STATUS[action]`-оор төлөв солино → `publish` үед `publishedAt = new Date()`, `unpublish` үед `null` → `logActivity` → `revalidatePath("/")` ба `revalidatePath("/news/" + slug)`.

`remove`: `canDelete` шалгана, `logActivity` нь `postId: null`-тай (мэдээ устсан тул), дараа нь устгана.

**Review Focus #5:** `revalidatePath` байхгүй бол редактор «нийтэллээ» гэж харсан ч сайт 5 минут хуучин үлдэнэ.

- [ ] **Step 4: Run to verify they pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(studio): the editorial workflow, checked on the server"
```

---

### Task 8: Үйл явдлын бүртгэлийн харагдац

**Files:**
- Create: `apps/parliament-news/components/studio/activity-log.tsx`
- Create: `apps/parliament-news/lib/activity-labels.ts`
- Create: `apps/parliament-news/lib/activity-labels.test.ts`
- Modify: `apps/parliament-news/app/(studio)/studio/news/page.tsx`

**Interfaces:**
- Produces:
  ```ts
  export const ACTION_LABELS: Record<string, string>;
  export function actionLabel(action: string): string;
  ```

- [ ] **Step 1: Write the failing tests**

```ts
it("artifact-ийн үйлдлийн нэрс", () => {
  expect(actionLabel("create")).toBe("Үүсгэсэн");
  expect(actionLabel("submit")).toBe("Хянуулахаар илгээсэн");
  expect(actionLabel("approve")).toBe("Баталсан");
  expect(actionLabel("return")).toBe("Буцаасан");
  expect(actionLabel("publish")).toBe("Нийтэлсэн");
  expect(actionLabel("unpublish")).toBe("Сайтаас буулгасан");
  expect(actionLabel("delete")).toBe("Устгасан");
});
it("танихгүй үйлдлийг түүхий нэрээр нь — бүртгэл хоосорохгүй", () => {
  expect(actionLabel("whatever")).toBe("whatever");
});
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement**

`activity-log.tsx`: серверийн компонент, `NewsActivity`-г `createdAt desc`-ээр 40 мөр, `mnDateTime` (`lib/format.ts`) ашиглан. Хэрэглэгчийн нэрийг `User`-ээс. Жагсаалтын хуудасны хажууд «Сүүлийн үйл явдал» багана.

- [ ] **Step 4: Run tests; open `/studio/news` and confirm the log shows the actions from Task 7**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(studio): the activity log"
```

---

### Task 9: Баримтжуулалт ба бүх шалгалт

**Files:**
- Modify: `apps/parliament-news/README.md`

- [ ] **Step 1: README — студийн хэсэг**

Нэвтрэх зам (`/studio/signin`), 10 үүргийн хүснэгт (нэр, монгол тайлбар,
ямар хэсгийг засахыг `SECTIONS`-оос), урсгалын мөр
(`Ноорог → Хянагдаж буй → Батлагдсан → Нийтлэгдсэн`, буцаалтын сум),
үйлдэл бүрийг хэн хийж чадахын хүснэгт, хэрэглэгч нэмэх команд.

- [ ] **Step 2: Бүх шалгалт**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build && pnpm check:browser`
Expected: бүгд PASS. `check:browser` нь нийтийн нүүрэнд өөрчлөлт ороогүйг
баталгаажуулна — студи нь түүнийг хөндөх ёсгүй.

- [ ] **Step 3: Commit**

```bash
git add apps/parliament-news/README.md
git commit -m "docs(studio): the editorial workflow and who may do what"
```

---

## Дууссаны дараа

Бүтэн branch-ийн хяналт, дараа нь `superpowers:finishing-a-development-branch`.

**Энэ төлөвлөгөөнд ОРООГҮЙ — 3b, 3c:**
- **3b — Мэдээ засварлагч:** гарчиг, биет, хавтасны дизайнер (`look`), зураг/видео, хуулийн төсөл, стори, цаг товлох. `admin.html`-ийн `v-edit`.
- **3c — Модуль ба баг:** тохиргоо (ирц, хуваарь, ШУУД, толгой/хөл), зургийн сан, сэтгэгдэл, хэрэглэгч/эрх, самбар.
