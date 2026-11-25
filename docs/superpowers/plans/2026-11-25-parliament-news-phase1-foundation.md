# Parliament News — 1-р шат: суурь (схем, tenant, эрх) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/parliament-news` апп, multi-tenant Prisma схем, tenantId-г автоматаар шүүдэг давхарга, домэйноор tenant таних, 10 редакцын эрхийн серверийн модуль, Gerel News-ийн seed — дээр нь нийтийн сайт ба CMS бичих суурь.

**Architecture:** Монорепод шинэ Next.js 14 App Router апп (`@nuul/news`), `packages/db`-ийн нэг Prisma схемийг хуваалцана (шинэ моделиуд `pn_*` хүснэгтэнд). `middleware.ts` (Edge) зөвхөн host-ыг хэлбэржүүлнэ, tenant-ыг Node runtime дээр DB-ээс кэштэй хайна. Контентын query бүр Prisma client extension-оор `tenantId`-гаар автоматаар шүүгдэнэ. Эрх `TenantMember`-т, зөвшөөрлийг сервер шалгана.

**Tech Stack:** Next.js 14.2, React 18.3, TypeScript 5.5 (strict), Prisma 5.22 + Postgres, NextAuth 4.24, tRPC 11, Zod 3.23, Tailwind 3.4, Vitest 2 (шинээр), pnpm 10.33 + turbo

**Spec:** [docs/superpowers/specs/2026-11-25-parliament-news-platform-design.md](../specs/2026-11-25-parliament-news-platform-design.md)

**Хамрах хүрээ:** Дизайн бичгийн §6-ийн **1-р шат** зөвхөн. 2–6-р шат (нийтийн сайт+SEO, CMS, парламентын модулиуд, сошиал, хамгаалалт) тус бүр өөрийн төлөвлөгөөтэй болно. Энэ шат дуусахад: апп build болж, tenant танигдаж, тусгаарлалт DB тестээр батлагдаж, эрх шалгагдаж, Gerel News-ийн өгөгдөл DB-д сууна.

## Global Constraints

- Шинэ апп `apps/parliament-news`, пакежийн нэр `@nuul/news`. `apps/web`-ийн ямар ч файл **хөндөхгүй**.
- `packages/db/prisma/schema.prisma`-д зөвхөн **нэмнэ**. Байгаа 37 модель, enum-ыг засахгүй. `packages/db/prisma/seed.ts`-д хүрэхгүй (тэр `deleteMany` хийдэг).
- Шинэ хүснэгт бүр `@@map("pn_<нэр>")`. Prisma enum нэр давхардахгүй: `NewsRole`, `NewsStatus` (`UserRole`, `PostStatus` аль хэдийн байна).
- Контентын модель бүрт `tenantId String` + `@@index([tenantId, ...])`. slug-тай модельд `@@unique([tenantId, slug])`.
- **Контентын query бүр `forTenant(tenantId)`-ээр явна** (Task 5). Нүцгэн `prisma.newsPost.*` зөвхөн seed, migration, тестэд.
- Кирилл → латин: **ө→o, ү→u** (ö/ü биш). Нийтэлсний дараа slug тогтмол; гараар сольвол `NewsSlugRedirect`-д 301 бичлэг.
- Хэрэглэгчид харагдах бүх текст монгол хэл.
- Prisma client-ыг `@nuul/db`-ээс import хийнэ. `next.config.js`-д `transpilePackages: ["@nuul/ui", "@nuul/db"]`.
- tsconfig `paths`: `@/*` → `./*`, `@nuul/ui`, `@nuul/db` — `apps/web/tsconfig.json`-той адил.
- 10 эрхийн кодчилол `site-v2/admin.html:844-886`-аас өөрчлөгдөхгүй. Урсгалын төлөв: `draft, review, approved, published, returned`.
- Нууц үг, API түлхүүрийг кодонд бичихгүй — зөвхөн env.

## Review Focus

1. **Tenant хөндлөн гоожилт** — нэг байгууллагын мэдээ нөгөөд харагдах. Task 5-ийн 3 DB тест.
2. **`TenantMember` бичлэггүй нэвтэрсэн хэрэглэгч** → эрхгүй. Artifact-д `canEdit ? 'reporter'` байсан; бодит сервер дээр энэ нь nuul.mn-ийн ямар ч хэрэглэгчийг сэтгүүлч болгоно. Task 6, 8.
3. **Шат алгасах төлөвийн шилжилт** (`reporter`: draft→published, `reviewer`: approved→published) → сервер татгалзана. Task 6.
4. **Танигдаагүй / хэлбэржээгүй host** (том үсэг, `www.`, порт, IP, header байхгүй) → өөр tenant үзүүлэхгүй, 404. Task 7.
5. **Нийтлэгдсэн мэдээний хаяг эвдрэх** — гарчиг засахад slug өөрчлөгдөж хуучин линк 404 болох. Task 1-ийн `nextSlug`/`changeSlug`.

---

### Task 1: Апп scaffold, Vitest, slug (латин + тогтмол + redirect)

**Files:**
- Create: `apps/parliament-news/package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `apps/parliament-news/lib/slug.ts`
- Test: `apps/parliament-news/lib/slug.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `cyrillicToLatin(text: string): string`
  - `toSlug(title: string): string`
  - `uniqueSlug(base: string, taken: string[]): string`
  - `nextSlug(input: { title: string; currentSlug: string | null; publishedAt: Date | null; taken: string[] }): string`
  - `changeSlug(input: { currentSlug: string; newSlug: string; taken: string[] }): { slug: string; redirectFrom: string | null }`

- [ ] **Step 1: Апп scaffold**

`package.json`: нэр `@nuul/news`, `private: true`, scripts `dev` (`next dev -p 3001`), `build`, `start`, `lint`, `test` (`vitest run`), `test:unit` (`vitest run lib`). Dependencies `apps/web/package.json`-оос: `next@^14.2.0`, `react@^18.3.0`, `react-dom@^18.3.0`, `@nuul/db workspace:*`, `@nuul/ui workspace:*`, `@prisma/client@^5.22.0`, `next-auth@^4.24.0`, `@trpc/{server,client,react-query}@^11.0.0`, `@tanstack/react-query@^5.60.0`, `zod@^3.23.0`, `clsx`, `tailwind-merge`, `lucide-react@^0.460.0`. devDeps: `typescript@^5.5.0`, `@types/{node,react,react-dom}`, `tailwindcss@^3.4.0`, `autoprefixer`, `postcss`, `vitest@^2.1.0`, `dotenv@^16.4.0`.
`vitest.config.ts`: `test.environment: "node"`, `test.setupFiles: ["./vitest.setup.ts"]`; setup файл нь `dotenv`-ээр репогийн `../../.env`-ийг уншина (Task 5-ийн DB тестэд `DATABASE_URL` хэрэгтэй).
`app/page.tsx` — «Parliament News» гэсэн нэг h1 (2-р шатанд солигдоно).

- [ ] **Step 2: Байгуулалт ажиллаж байгааг шалгах**

Run: `pnpm install && pnpm --filter @nuul/news build`
Expected: build амжилттай, `apps/web` хөндөгдөөгүй.

- [ ] **Step 3: Slug-ийн тестийг бичих (унах ёстой)**

```ts
// apps/parliament-news/lib/slug.test.ts
import { describe, it, expect } from "vitest";
import { toSlug, uniqueSlug, nextSlug, changeSlug } from "./slug";

describe("toSlug", () => {
  it("кирилл гарчгийг латин slug болгоно (ө→o, ү→u)", () => {
    expect(toSlug("Чуулган хуралдлаа")).toBe("chuulgan-khuraldlaa");
    expect(toSlug("Өнөөдөр парламентад")).toBe("onoodor-parlamentad");
    expect(toSlug("Хуулийн мэдээ")).toBe("khuuliin-medee");
    expect(toSlug("Үндсэн хууль")).toBe("undsen-khuuli");
  });
  it("тэмдэгт, давхар зай, уртыг цэвэрлэнэ", () => {
    expect(toSlug("  Төсөв: 2027 он!  ")).toBe("tosov-2027-on");
    expect(toSlug("а".repeat(120)).length).toBeLessThanOrEqual(80);
  });
  it("хоосон үр дүнд нөөц нэр буцаана", () => {
    expect(toSlug("!!! ???")).toBe("medee");
    expect(toSlug("")).toBe("medee");
  });
});

describe("uniqueSlug", () => {
  it("давхардсан бол тоо нэмнэ", () => {
    expect(uniqueSlug("tosov", [])).toBe("tosov");
    expect(uniqueSlug("tosov", ["tosov"])).toBe("tosov-2");
    expect(uniqueSlug("tosov", ["tosov", "tosov-2"])).toBe("tosov-3");
  });
});

describe("nextSlug", () => {
  it("ноорог үед гарчгаас дахин тооцно", () => {
    expect(nextSlug({ title: "Шинэ гарчиг", currentSlug: "khuuchin", publishedAt: null, taken: [] }))
      .toBe("shine-garchig");
  });
  it("нийтэлсний дараа гарчиг засахад slug хөдлөхгүй", () => {
    expect(nextSlug({ title: "Шинэ гарчиг", currentSlug: "khuuchin", publishedAt: new Date("2027-01-02"), taken: [] }))
      .toBe("khuuchin");
  });
  it("давхардлыг tenant дотор шийднэ", () => {
    expect(nextSlug({ title: "Төсөв", currentSlug: null, publishedAt: null, taken: ["tosov"] }))
      .toBe("tosov-2");
  });
});

describe("changeSlug", () => {
  it("гараар сольход хуучин хаягийг redirect-д өгнө", () => {
    expect(changeSlug({ currentSlug: "tosov", newSlug: "Төсвийн мэдээ", taken: [] }))
      .toEqual({ slug: "tosviin-medee", redirectFrom: "tosov" });
  });
  it("өөрчлөгдөөгүй бол redirect гаргахгүй", () => {
    expect(changeSlug({ currentSlug: "tosov", newSlug: "tosov", taken: ["tosov"] }))
      .toEqual({ slug: "tosov", redirectFrom: null });
  });
});
```

- [ ] **Step 4: Тест унаж байгааг шалгах**

Run: `pnpm --filter @nuul/news test slug`
Expected: FAIL — `./slug` олдохгүй.

- [ ] **Step 5: `lib/slug.ts`-ийг хэрэгжүүлэх**

Хөрвүүлэх хүснэгт (яг ийм байх — тестүүд үүнээс хамаарна):

```ts
const MAP: Record<string, string> = {
  а:"a", б:"b", в:"v", г:"g", д:"d", е:"e", ё:"yo", ж:"j", з:"z", и:"i",
  й:"i", к:"k", л:"l", м:"m", н:"n", о:"o", ө:"o", п:"p", р:"r", с:"s",
  т:"t", у:"u", ү:"u", ф:"f", х:"kh", ц:"ts", ч:"ch", ш:"sh", щ:"shch",
  ъ:"", ы:"y", ь:"i", э:"e", ю:"yu", я:"ya",
};
```

`cyrillicToLatin` — жижиг үсэг болгож MAP-аар хөрвүүлнэ, байхгүй тэмдэгтийг хэвээр үлдээнэ.
`toSlug` — хөрвүүлж, `[^a-z0-9]+` → `-`, эхэн/адагийн `-` хасаж, 80 тэмдэгтээр тасалж (сүүлийн `-`-ыг арилгана), хоосон бол `"medee"`.
`uniqueSlug` — `taken`-д байвал `-2`-оос өсгөж олдоогүйг буцаана.
`nextSlug` — `publishedAt` байвал `currentSlug`-ыг хэвээр (null бол `toSlug(title)`); үгүй бол `uniqueSlug(toSlug(title), taken)`. Тооцсон slug нь `currentSlug`-тай тэнцвэл `taken`-ийг үл хэрэгсэнэ.
`changeSlug` — `uniqueSlug(toSlug(newSlug), taken)`; `currentSlug`-аас өөр бол `redirectFrom: currentSlug`, адил бол `null`.

- [ ] **Step 6: Тест ажиллахыг шалгах**

Run: `pnpm --filter @nuul/news test slug`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/parliament-news
git commit -m "feat(news): scaffold app with vitest and stable latin slug rules"
```

---

### Task 2: Схем — `Tenant`, `TenantMember`, `NewsRole`

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (файлын адагт `// ===================== PARLIAMENT NEWS =====================` хэсэг нэмнэ)

**Interfaces:**
- Consumes: —
- Produces: Prisma моделиуд `Tenant`, `TenantMember`; enum `NewsRole`

- [ ] **Step 1: Моделиудыг нэмэх**

`Tenant`: `id` (cuid), `slug` (@unique), `name`, `domains String[]`, `logoUrl String?`, `brandColor String @default("#1d3fe3")`, `accentColor String @default("#f26a1b")`, `locale String @default("mn")`, `active Boolean @default(true)`, `createdAt`, `updatedAt`, `@@map("pn_tenants")`.
`TenantMember`: `id`, `tenantId` → `Tenant` (`onDelete: Cascade`), `userId` → `User` (`onDelete: Cascade`), `role NewsRole`, `active Boolean @default(true)`, `createdAt`, `@@unique([tenantId, userId])`, `@@index([userId])`, `@@map("pn_tenant_members")`.
`enum NewsRole`: `SUPER CHIEF REVIEWER REPORTER MEDIA LEGAL SOCIAL LIVE CONTRIBUTOR ANALYST`.
`User`-т зөвхөн `newsMemberships TenantMember[]` гэсэн нэг мөр нэмнэ — бусад талбарт хүрэхгүй.

- [ ] **Step 2: Схем хүчинтэйг шалгах**

Run: `cd packages/db && pnpm exec prisma validate --schema=prisma/schema.prisma`
Expected: `The schema is valid`.

- [ ] **Step 3: Migration үүсгэж хэрэглэх**

Run: `cd packages/db && pnpm db:migrate -- --name pn_tenants`
Expected: `pn_tenants`, `pn_tenant_members` үүснэ; байгаа хүснэгтэд `ALTER`/`DROP` гарахгүй (migration SQL-ийг нүдээр шалгана).

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma
git commit -m "feat(db): add Tenant, TenantMember and NewsRole for multi-tenant news"
```

---

### Task 3: Схем — контент (`NewsPost`, `NewsMedia`, `NewsCategory`, `NewsSlugRedirect`, `NewsComment`, `NewsActivity`, `TenantSetting`)

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Consumes: Task 2-ийн `Tenant`
- Produces: `NewsPost`, `NewsMedia`, `NewsCategory`, `NewsSlugRedirect`, `NewsComment`, `NewsActivity`, `TenantSetting`; enum `NewsStatus`

- [ ] **Step 1: Моделиудыг нэмэх**

`enum NewsStatus`: `DRAFT REVIEW APPROVED PUBLISHED RETURNED`.
`NewsPost` — artifact-ийн `news` doc (`site-v2/index.html:1003` `clean()`):
`id`, `tenantId`, `slug`, `title String @db.VarChar(200)`, `kicker String?`, `lead String? @db.VarChar(400)`, `body String? @db.Text`, `date DateTime @db.Date`, `categoryId String?`, `subcategory String?`, `reporter String?`, `sources String[]`, `motif String @default("grid")`, `look Json?`, `theme Int @default(0)`, `featured Boolean @default(false)`, `story Boolean @default(false)`, `storyUntil DateTime?`, `tags String[]`, `channels String[]` (`Сайт, Facebook, YouTube, Instagram, TikTok`), `status NewsStatus @default(DRAFT)`, `scheduledAt DateTime?`, `publishedAt DateTime?`, `authorId String?` → `User`, `reviewNote String?`, `views Int @default(0)`, `createdAt`, `updatedAt`.
Индекс: `@@unique([tenantId, slug])`, `@@index([tenantId, status, publishedAt])`, `@@index([tenantId, categoryId])`, `@@map("pn_posts")`.
`NewsMedia`: `id`, `tenantId`, `postId` → `NewsPost` (`onDelete: Cascade`), `kind String` (`image`/`video`), `url`, `caption String? @db.VarChar(200)`, `order Int @default(0)`, `@@index([postId])`, `@@map("pn_media")`.
`NewsCategory` — artifact-ийн `cats:[{n, sub[], menu}]`: `id`, `tenantId`, `slug`, `name String @db.VarChar(40)`, `parentId String?` → өөрөө (`sub` → дэд ангилал), `inMenu Boolean @default(false)`, `order Int @default(0)`, `@@unique([tenantId, slug])`, `@@index([tenantId, parentId])`, `@@map("pn_categories")`.
`NewsSlugRedirect`: `id`, `tenantId`, `fromSlug`, `postId` → `NewsPost` (`onDelete: Cascade`), `createdAt`, `@@unique([tenantId, fromSlug])`, `@@map("pn_slug_redirects")`.
`NewsComment`: `id`, `tenantId`, `postId` → `NewsPost` (`onDelete: Cascade`), `userId String?` → `User`, `authorName String @db.VarChar(60)`, `body String @db.VarChar(600)`, `hidden Boolean @default(false)`, `createdAt`, `@@index([tenantId, postId])`, `@@map("pn_comments")`.
`NewsActivity`: `id`, `tenantId`, `postId String?`, `userId String?`, `action String` (`create|save|submit|approve|return|publish|unpublish|status`), `note String?`, `createdAt`, `@@index([tenantId, createdAt])`, `@@map("pn_activity")`.
`TenantSetting`: `id`, `tenantId`, `key`, `value Json`, `updatedAt`, `@@unique([tenantId, key])`, `@@map("pn_settings")`.

- [ ] **Step 2: Шалгаж, migration хэрэглэх**

Run: `cd packages/db && pnpm exec prisma validate --schema=prisma/schema.prisma && pnpm db:migrate -- --name pn_content`
Expected: валид, 7 хүснэгт үүснэ.

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma
git commit -m "feat(db): add news content models with slug redirects"
```

---

### Task 4: Схем — парламент ба сурталчилгаа (`Bill`, `BillStage`, `Agenda`, `LiveState`, `Banner`, `TickerAd`, `AdRate`, `FxRate`)

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Consumes: Task 2-ийн `Tenant`, Task 3-ийн `NewsPost`
- Produces: `Bill`, `BillStage`, `Agenda`, `LiveState`, `Banner`, `TickerAd`, `AdRate`, `FxRate`

- [ ] **Step 1: Моделиудыг нэмэх**

`Bill`: `id`, `tenantId`, `postId String? @unique` → `NewsPost`, `title`, `stage Int @default(0)` (0–4: Өргөн мэдүүлсэн → Баталсан), `votesYes Int @default(0)`, `votesNo Int @default(0)`, `createdAt`, `updatedAt`, `@@index([tenantId, stage])`, `@@map("pn_bills")`.
`BillStage`: `id`, `billId` → `Bill` (`onDelete: Cascade`), `index Int` (0–4), `date DateTime? @db.Date`, `note String? @db.VarChar(1500)`, `sources String[]`, `@@unique([billId, index])`, `@@map("pn_bill_stages")`.
`Agenda` — `agenda:[{t,x}]`: `id`, `tenantId`, `date DateTime @db.Date`, `time String @db.VarChar(8)`, `text String @db.VarChar(120)`, `order Int @default(0)`, `@@index([tenantId, date])`, `@@map("pn_agenda")`.
`LiveState` — `att, status, live:{on,t,u}, breaking:{on,t,n}, ticker`: `id`, `tenantId String @unique`, `attendance Int @default(0)` (0–126), `sessionStatus String @default("Хуралдаж байна")`, `tickerOn Boolean @default(true)`, `liveOn Boolean @default(false)`, `liveTitle String? @db.VarChar(80)`, `liveUrl String?`, `breakingOn Boolean @default(false)`, `breakingText String? @db.VarChar(140)`, `breakingPostId String?`, `updatedAt`, `updatedById String?`, `@@map("pn_live")`.
`Banner` — `banners:[{img,u,t,p,from,to,paid,amt}]`: `id`, `tenantId`, `imageUrl`, `linkUrl String?`, `title String? @db.VarChar(80)`, `placement String @default("both")` (`feed|side|both|article|all`), `startsOn DateTime? @db.Date`, `endsOn DateTime? @db.Date`, `paid Boolean @default(true)`, `amount Int @default(0)` (₮), `order Int @default(0)`, `@@index([tenantId, placement])`, `@@map("pn_banners")`.
`TickerAd` — `ads:[{x,u}]`: `id`, `tenantId`, `text String @db.VarChar(120)`, `url String?`, `active Boolean @default(true)`, `order Int @default(0)`, `@@index([tenantId])`, `@@map("pn_ticker_ads")`.
`AdRate` — `adrates:[{pl,sz,u,pr,nt}]`: `id`, `tenantId`, `place String @db.VarChar(60)`, `size String? @db.VarChar(40)`, `unit String @default("week")` (`day|week|month|post`), `price Int @default(0)`, `note String? @db.VarChar(120)`, `order Int @default(0)`, `@@index([tenantId])`, `@@map("pn_ad_rates")`.
`FxRate` — `fx:[{c,v,ch}]`: `id`, `tenantId`, `code String @db.VarChar(8)`, `value Decimal @db.Decimal(14,4)`, `change Decimal @default(0) @db.Decimal(10,4)`, `order Int @default(0)`, `updatedAt`, `@@unique([tenantId, code])`, `@@map("pn_fx_rates")`.

- [ ] **Step 2: Шалгаж, migration хэрэглэх**

Run: `cd packages/db && pnpm exec prisma validate --schema=prisma/schema.prisma && pnpm db:migrate -- --name pn_parliament`
Expected: валид, 8 хүснэгт үүснэ.

- [ ] **Step 3: Prisma client шинэчлэгдэхийг шалгах**

Run: `cd packages/db && pnpm db:generate`
Expected: амжилттай; `prisma.newsPost`, `prisma.liveState`, `prisma.adRate` бэлэн болно.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma
git commit -m "feat(db): add bill, agenda, live, banner, ad rate and fx models"
```

---

### Task 5: Tenant тусгаарлалтын давхарга (Prisma extension) + DB тест

**Files:**
- Create: `apps/parliament-news/lib/tenant-db.ts`
- Test: `apps/parliament-news/lib/tenant-db.db.test.ts`

**Interfaces:**
- Consumes: Task 2–4-ийн моделиуд, `@nuul/db`-ийн `prisma`
- Produces:
  - `TENANT_MODELS: readonly string[]` — tenantId-тай моделиудын нэр
  - `forTenant(tenantId: string): TenantClient` — `prisma.$extends(...)`-ийн үр дүн

- [ ] **Step 1: DB тестийг бичих (унах ёстой)**

Тест нь `DATABASE_URL`-тай ажиллана (`vitest.setup.ts` `.env`-ийг уншина). Өөрийн хоёр tenant үүсгэж, `afterAll`-д устгана.

```ts
// apps/parliament-news/lib/tenant-db.db.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@nuul/db";
import { forTenant } from "./tenant-db";

let a: string, b: string;
const sfx = Date.now().toString(36);

beforeAll(async () => {
  const ta = await prisma.tenant.create({ data: { slug: `test-a-${sfx}`, name: "A", domains: [] } });
  const tb = await prisma.tenant.create({ data: { slug: `test-b-${sfx}`, name: "B", domains: [] } });
  a = ta.id; b = tb.id;
  await prisma.newsPost.create({ data: { tenantId: a, slug: "a-post", title: "A мэдээ", date: new Date() } });
  await prisma.newsPost.create({ data: { tenantId: b, slug: "b-post", title: "B мэдээ", date: new Date() } });
});

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { id: { in: [a, b] } } });
  await prisma.$disconnect();
});

describe("forTenant", () => {
  it("зөвхөн өөрийн tenant-ийн мэдээг уншина", async () => {
    const rows = await forTenant(a).newsPost.findMany({});
    expect(rows.map((r) => r.slug)).toEqual(["a-post"]);
    const leak = await forTenant(a).newsPost.findFirst({ where: { slug: "b-post" } });
    expect(leak).toBeNull();
  });

  it("create дээр tenantId-г автоматаар тавина, өөр tenant-ыг зөвшөөрөхгүй", async () => {
    const created = await forTenant(a).newsPost.create({
      data: { slug: `auto-${sfx}`, title: "Авто", date: new Date() } as any,
    });
    expect(created.tenantId).toBe(a);
    await expect(
      forTenant(a).newsPost.create({ data: { tenantId: b, slug: `bad-${sfx}`, title: "Хог", date: new Date() } as any }),
    ).rejects.toThrow();
  });

  it("updateMany өөр tenant-д хүрэхгүй", async () => {
    const n = await forTenant(a).newsPost.updateMany({ where: {}, data: { kicker: "A" } });
    expect(n.count).toBeGreaterThan(0);
    const bRow = await prisma.newsPost.findFirst({ where: { tenantId: b } });
    expect(bRow?.kicker).toBeNull();
  });

  it("findUnique/update/delete-ийг хориглоно (async reject)", async () => {
    await expect(forTenant(a).newsPost.findUnique({ where: { id: "x" } })).rejects.toThrow(/findFirst/);
    await expect(forTenant(a).newsPost.delete({ where: { id: "x" } })).rejects.toThrow(/deleteMany/);
  });
});
```

- [ ] **Step 2: Тест унаж байгааг шалгах**

Run: `pnpm --filter @nuul/news test tenant-db`
Expected: FAIL — `./tenant-db` олдохгүй.

- [ ] **Step 3: `lib/tenant-db.ts`-ийг хэрэгжүүлэх**

`TENANT_MODELS`: `NewsPost, NewsMedia, NewsCategory, NewsSlugRedirect, NewsComment, NewsActivity, TenantSetting, Bill, Agenda, LiveState, Banner, TickerAd, AdRate, FxRate` (`BillStage` нь `Bill`-ээр дамжина — оруулахгүй).
`forTenant(tenantId)` → `prisma.$extends({ query: { $allModels: { async $allOperations({ model, operation, args, query }) { ... } } } })`:
- `TENANT_MODELS`-д байхгүй модель → хөндөхгүй, шууд `query(args)`.
- `findMany, findFirst, findFirstOrThrow, count, aggregate, groupBy, updateMany, deleteMany` → `args.where = { ...args.where, tenantId }`.
- `create` → `args.data.tenantId`: байхгүй бол тавина; өөр tenant бол `throw new Error("tenantId зөрчил")`. `createMany` → мөр бүрт адил.
- `upsert` → `where`-т tenantId нэмэх боломжгүй тул `Error("upsert-ийг tenant модельд хэрэглэхгүй — findFirst + create/update")`.
- `findUnique, findUniqueOrThrow, update, delete` → `Error("<model>: findUnique/update/delete хориотой — findFirst, updateMany, deleteMany хэрэглэ")`. Шалтгаан: Prisma эдгээрийн `where`-т unique биш `tenantId`-г зөвшөөрөхгүй, өөр tenant-ийн мөрийг id-гаар засах эрсдэлтэй.

- [ ] **Step 4: Тест ажиллахыг шалгах**

Run: `pnpm --filter @nuul/news test tenant-db`
Expected: PASS (4 тест). DB-д туршилтын tenant үлдээгүйг шалгана:
`cd packages/db && pnpm exec prisma studio` биш — `prisma.tenant.count({ where: { slug: { startsWith: "test-" } } })` нь `0`.

- [ ] **Step 5: Commit**

```bash
git add apps/parliament-news/lib/tenant-db.ts apps/parliament-news/lib/tenant-db.db.test.ts
git commit -m "feat(news): auto tenant-scoping prisma extension with isolation tests"
```

---

### Task 6: Эрхийн модуль

**Files:**
- Create: `apps/parliament-news/lib/permissions.ts`
- Test: `apps/parliament-news/lib/permissions.test.ts`

**Interfaces:**
- Consumes: Task 2-ийн `NewsRole`, Task 3-ийн `NewsStatus`
- Produces:
  - `ROLE_LABELS: Record<NewsRole, { name: string; desc: string }>`
  - `canCreate(role: NewsRole | null): boolean`
  - `editableSections(role: NewsRole | null): Section[]` — `Section = "basic"|"photos"|"video"|"bill"|"src"|"look"|"pub"`
  - `visibleStatuses(role: NewsRole | null): NewsStatus[]`
  - `canDelete(role: NewsRole | null, post: { authorId: string | null; status: NewsStatus }, userId: string): boolean`
  - `canTransition(role: NewsRole | null, from: NewsStatus, to: NewsStatus): boolean`
  - `canEditSettings(role: NewsRole | null): boolean`

- [ ] **Step 1: Тестийг бичих (унах ёстой)**

`site-v2/admin.html:844-886`-ийн дүрмийг тогтоох тестүүд:

```ts
// apps/parliament-news/lib/permissions.test.ts
import { describe, it, expect } from "vitest";
import { canCreate, editableSections, visibleStatuses, canDelete, canTransition, canEditSettings } from "./permissions";

describe("гишүүн биш хэрэглэгч", () => {
  it("юу ч хийхгүй", () => {
    expect(canCreate(null)).toBe(false);
    expect(editableSections(null)).toEqual([]);
    expect(visibleStatuses(null)).toEqual([]);
    expect(canEditSettings(null)).toBe(false);
    expect(canTransition(null, "DRAFT", "PUBLISHED")).toBe(false);
    expect(canDelete(null, { authorId: "u1", status: "DRAFT" }, "u1")).toBe(false);
  });
});

describe("editableSections", () => {
  it("эрх бүрийн хэсгүүд (SECS)", () => {
    expect(editableSections("CHIEF")).toEqual(["basic","photos","video","bill","src","look","pub"]);
    expect(editableSections("REPORTER")).toEqual(["basic","photos","video","bill","src","look"]);
    expect(editableSections("CONTRIBUTOR")).toEqual(["basic","src","look"]);
    expect(editableSections("MEDIA")).toEqual(["photos","video"]);
    expect(editableSections("LEGAL")).toEqual(["bill","src"]);
    expect(editableSections("SOCIAL")).toEqual(["pub"]);
    expect(editableSections("LIVE")).toEqual([]);
    expect(editableSections("ANALYST")).toEqual([]);
  });
});

describe("visibleStatuses", () => {
  it("медиа редактор нийтлэгдсэнийг харахгүй", () => {
    expect(visibleStatuses("MEDIA")).not.toContain("PUBLISHED");
  });
  it("супер админ бүгдийг харна", () => {
    expect(visibleStatuses("SUPER")).toHaveLength(5);
  });
});

describe("canEditSettings", () => {
  it("зөвхөн super, chief, live", () => {
    expect(["SUPER","CHIEF","LIVE"].every((r) => canEditSettings(r as any))).toBe(true);
    expect(canEditSettings("REVIEWER")).toBe(false);
  });
});

describe("canDelete", () => {
  const own = { authorId: "u1", status: "DRAFT" as const };
  it("сэтгүүлч өөрийн ноорогоо устгана", () => {
    expect(canDelete("REPORTER", own, "u1")).toBe(true);
  });
  it("бусдын мэдээг устгахгүй", () => {
    expect(canDelete("REPORTER", own, "u2")).toBe(false);
  });
  it("хянуулахаар илгээснийг устгахгүй", () => {
    expect(canDelete("REPORTER", { authorId: "u1", status: "REVIEW" }, "u1")).toBe(false);
  });
  it("ерөнхий редактор бүгдийг устгана", () => {
    expect(canDelete("CHIEF", { authorId: "u9", status: "PUBLISHED" }, "u1")).toBe(true);
  });
});

describe("canTransition", () => {
  it("сэтгүүлч шууд нийтлэхгүй", () => {
    expect(canTransition("REPORTER", "DRAFT", "PUBLISHED")).toBe(false);
    expect(canTransition("REPORTER", "DRAFT", "REVIEW")).toBe(true);
  });
  it("хянагч батална, нийтлэхгүй", () => {
    expect(canTransition("REVIEWER", "REVIEW", "APPROVED")).toBe(true);
    expect(canTransition("REVIEWER", "REVIEW", "RETURNED")).toBe(true);
    expect(canTransition("REVIEWER", "APPROVED", "PUBLISHED")).toBe(false);
  });
  it("ерөнхий редактор нийтэлж, буулгана", () => {
    expect(canTransition("CHIEF", "APPROVED", "PUBLISHED")).toBe(true);
    expect(canTransition("CHIEF", "PUBLISHED", "DRAFT")).toBe(true);
  });
  it("шинжээч юу ч солихгүй", () => {
    expect(canTransition("ANALYST", "DRAFT", "REVIEW")).toBe(false);
  });
});
```

- [ ] **Step 2: Тест унаж байгааг шалгах**

Run: `pnpm --filter @nuul/news test permissions`
Expected: FAIL.

- [ ] **Step 3: `lib/permissions.ts`-ийг хэрэгжүүлэх**

`ROLE_LABELS`-ийн монгол нэр, тайлбарыг `site-v2/admin.html:844-854`-ээс **яг хуулна**.
`editableSections` — `admin.html`-ийн `SECS` хүснэгт. `canCreate` — `SUPER, CHIEF, REVIEWER, REPORTER, CONTRIBUTOR`. `canEditSettings` — `SUPER, CHIEF, LIVE` (`admin.html`-ийн `navSet`).
`visibleStatuses` — `MEDIA`, `LEGAL`: `PUBLISHED`-гүй; `SOCIAL`: `APPROVED, PUBLISHED`; `REPORTER`, `CONTRIBUTOR`: бүх төлөв (өөрийн мэдээг router шүүнэ); `LIVE`, `ANALYST`: зөвхөн `PUBLISHED`; `SUPER`, `CHIEF`, `REVIEWER`: бүх 5.
`canTransition` — зөвшөөрөгдсөн `(role, from, to)` гурвалжны хүснэгтээр; хүснэгтэд байхгүй бол `false`.

- [ ] **Step 4: Тест ажиллахыг шалгах**

Run: `pnpm --filter @nuul/news test permissions`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parliament-news/lib/permissions.ts apps/parliament-news/lib/permissions.test.ts
git commit -m "feat(news): server-side editorial permission module for 10 roles"
```

---

### Task 7: Tenant таних ба middleware

**Files:**
- Create: `apps/parliament-news/lib/tenant.ts`, `apps/parliament-news/middleware.ts`
- Test: `apps/parliament-news/lib/tenant.test.ts`

**Interfaces:**
- Consumes: Task 2-ийн `Tenant`
- Produces:
  - `parseHost(host: string | null): { kind: "domain" | "subdomain" | "unknown"; value: string | null }`
  - `getTenantByHost(host: string | null): Promise<Tenant | null>` (кэштэй, Node runtime)
  - `requireTenant(): Promise<Tenant>` — server component-д, `x-tenant-host` header-ээс; олдохгүй бол `notFound()`

**⚠ Edge runtime:** Next.js 14-ийн `middleware.ts` Edge дээр ажиллана — **Prisma дуудаж болохгүй**. Middleware зөвхөн host-ыг хэлбэржүүлж header-т тавина; tenant-ыг DB-ээс хайх ажлыг Node runtime дээрх server component / tRPC context хийнэ.

- [ ] **Step 1: `parseHost`-ийн тестийг бичих (унах ёстой)**

```ts
// apps/parliament-news/lib/tenant.test.ts
import { describe, it, expect } from "vitest";
import { parseHost } from "./tenant";

describe("parseHost", () => {
  it("домэйныг хэлбэржүүлнэ", () => {
    expect(parseHost("parlamentnews.mn")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("WWW.ParlamentNews.MN")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("parlamentnews.mn:3000")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("parlamentnews.mn.")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
  });
  it("localhost дээрх subdomain-ыг tenant slug гэж үзнэ", () => {
    expect(parseHost("parlament.localhost:3001")).toEqual({ kind: "subdomain", value: "parlament" });
  });
  it("танихгүй оролтод unknown буцаана", () => {
    expect(parseHost(null)).toEqual({ kind: "unknown", value: null });
    expect(parseHost("")).toEqual({ kind: "unknown", value: null });
    expect(parseHost("localhost:3001")).toEqual({ kind: "unknown", value: null });
    expect(parseHost("127.0.0.1:3001")).toEqual({ kind: "unknown", value: null });
  });
});
```

- [ ] **Step 2: Тест унаж байгааг шалгах**

Run: `pnpm --filter @nuul/news test tenant.test`
Expected: FAIL.

- [ ] **Step 3: `lib/tenant.ts`-ийг хэрэгжүүлэх**

`parseHost` — жижиг үсэг, порт, trailing dot, `www.` хасна; `*.localhost` → `subdomain`; IP ба нүцгэн `localhost` → `unknown`. Prisma import хийхгүй (middleware үүнийг Edge дээр дуудна).
`getTenantByHost` — `parseHost` дараа `domains has value` (`kind: "domain"`) эсвэл `slug = value` (`kind: "subdomain"`) гэж `prisma.tenant.findFirst({ where: { active: true, ... } })`; `kind: "unknown"` бол шууд `null`. `unstable_cache`-ээр `["tenant", value]` тэгтэй, 300 сек revalidate.
`requireTenant` — `headers().get("x-tenant-host")`-ыг `getTenantByHost`-д өгнө; `null` бол `notFound()`.

- [ ] **Step 4: `middleware.ts`-ийг бичих**

Зөвхөн хоёр ажил (DB-д хүрэхгүй):
1. `parseHost(request.headers.get("host"))`-ийн хэлбэржүүлсэн `value`-г `x-tenant-host` request header-т тавьж `NextResponse.next({ request: { headers } })` буцаана.
2. `/studio/*`-д `getToken` (`apps/web/middleware.ts`-ийн хэв шинжээр) — нэвтрээгүй бол `/studio/signin?callbackUrl=` руу redirect.

`matcher`: `/((?!_next|favicon|.*\\..*).*)`. Эрх ба tenant байгаа эсэхийг middleware шалгахгүй — tRPC context (Task 8) ба `requireTenant()` хийнэ.

- [ ] **Step 5: Тест ба build шалгах**

Run: `pnpm --filter @nuul/news test tenant.test && pnpm --filter @nuul/news build`
Expected: PASS, build амжилттай.

- [ ] **Step 6: Commit**

```bash
git add apps/parliament-news/lib/tenant.ts apps/parliament-news/lib/tenant.test.ts apps/parliament-news/middleware.ts
git commit -m "feat(news): resolve tenant from hostname without prisma on the edge"
```

---

### Task 8: tRPC context ба эрхийн procedure-ууд

**Files:**
- Create: `apps/parliament-news/lib/trpc.ts`, `apps/parliament-news/lib/auth.ts`, `apps/parliament-news/server/routers/index.ts`, `apps/parliament-news/app/api/trpc/[trpc]/route.ts`, `apps/parliament-news/app/api/auth/[...nextauth]/route.ts`
- Test: `apps/parliament-news/lib/trpc.test.ts`

**Interfaces:**
- Consumes: Task 5-ийн `forTenant`, Task 6-ийн эрхийн функцууд, Task 7-ийн `getTenantByHost`
- Produces:
  - `type Ctx = { db: TenantClient | null; tenantId: string | null; session: Session | null; role: NewsRole | null }`
  - `publicProcedure`, `tenantProcedure` (tenantId шаардана), `editorialProcedure` (гишүүн байхыг шаардана)
  - `requireRole(role: NewsRole | null, allowed: NewsRole[]): void` — зөвшөөрөгдөөгүй бол `TRPCError({ code: "FORBIDDEN" })`
  - `getNewsRole(tenantId: string, userId: string | undefined): Promise<NewsRole | null>`

- [ ] **Step 1: `requireRole`-ийн тестийг бичих (унах ёстой)**

```ts
// apps/parliament-news/lib/trpc.test.ts
import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { requireRole } from "./trpc";

describe("requireRole", () => {
  it("зөвшөөрөгдсөн эрхийг гаргана", () => {
    expect(() => requireRole("CHIEF", ["SUPER", "CHIEF"])).not.toThrow();
  });
  it("бусдыг FORBIDDEN-ээр татгалзана", () => {
    expect(() => requireRole("REPORTER", ["SUPER", "CHIEF"])).toThrow(TRPCError);
  });
  it("гишүүн биш (null) хэрэглэгчийг татгалзана", () => {
    expect(() => requireRole(null, ["REPORTER"])).toThrow(TRPCError);
  });
});
```

- [ ] **Step 2: Тест унаж байгааг шалгах**

Run: `pnpm --filter @nuul/news test trpc`
Expected: FAIL.

- [ ] **Step 3: `lib/auth.ts` ба `lib/trpc.ts`-ийг хэрэгжүүлэх**

`lib/auth.ts` — `apps/web/lib/auth.ts`-ийн `CredentialsProvider` хэсгийг хэв шинж болгон авч, `@nuul/db`-ийн `prisma`-г ашиглана. Google provider оруулахгүй (редакцын систем).
`lib/trpc.ts` — `initTRPC.context<Ctx>()`. `createContext` нь `x-tenant-host` header-ийг Task 7-ийн `getTenantByHost`-д өгч `tenantId`-г, `getServerSession`-оос session-ыг, `getNewsRole`-оор `TenantMember`-ийн эрхийг (зөвхөн `active: true`) авна. **Бичлэг байхгүй бол `null` — өөр ямар ч default эрх өгөхгүй** (Review Focus 2). `db` нь `tenantId` байвал `forTenant(tenantId)`.
`tenantProcedure` — `tenantId` байхгүй бол `NOT_FOUND`. `editorialProcedure` — `role === null` бол `FORBIDDEN`.
`server/routers/index.ts` — `appRouter` нь `health: publicProcedure.query(() => ({ ok: true }))` нэг procedure-тэй (2-р шатанд өснө), `export type AppRouter`.

- [ ] **Step 4: Тест ба build шалгах**

Run: `pnpm --filter @nuul/news test && pnpm --filter @nuul/news build`
Expected: PASS, build амжилттай.

- [ ] **Step 5: Commit**

```bash
git add apps/parliament-news/lib apps/parliament-news/server apps/parliament-news/app/api
git commit -m "feat(news): tenant-scoped tRPC context with editorial role guards"
```

---

### Task 9: Тохиргооны схем (`hdr`, `foot`, `wx`, `rss`, `fxsrc`)

**Files:**
- Create: `apps/parliament-news/lib/settings.ts`
- Test: `apps/parliament-news/lib/settings.test.ts`

**Interfaces:**
- Consumes: Task 3-ийн `TenantSetting`, Task 5-ийн `forTenant`
- Produces:
  - `headerSchema`, `footerSchema`, `weatherSchema`, `feedSchema` (Zod) + тэдгээрийн `z.infer` төрлүүд
  - `SETTING_KEYS = ["header", "footer", "weather", "feed"] as const`
  - `getSetting<K>(db: TenantClient, key: K): Promise<SettingOf<K>>` — байхгүй бол схемийн default
  - `putSetting<K>(db: TenantClient, key: K, value: unknown): Promise<void>` — `parse` хийж `upsert`

Хүснэгтийн мөр болгосон тохиргоонууд (`cats`, `banners`, `adrates`, `fx`, `ads`, `agenda`, `live`, `breaking`, `att`, `status`, `ticker`) энд **орохгүй** — Task 3, 4-ийн моделиуд тэднийг хариуцна.

- [ ] **Step 1: Тестийг бичих (унах ёстой)**

`site-v2/admin.html`-ийн `saveSet()`-ийн хязгаарлалтыг тогтооно:

```ts
// apps/parliament-news/lib/settings.test.ts
import { describe, it, expect } from "vitest";
import { headerSchema, footerSchema, weatherSchema, feedSchema } from "./settings";

describe("headerSchema", () => {
  it("логоны байрлал, цэс, хэмжээг хязгаарлана", () => {
    expect(headerSchema.parse({})).toEqual({ pos: "left", size: 30, tagline: "", menu: "inline" });
    expect(headerSchema.parse({ size: 999 }).size).toBe(56);
    expect(headerSchema.parse({ size: 1 }).size).toBe(20);
    expect(() => headerSchema.parse({ pos: "top" })).toThrow();
    expect(() => headerSchema.parse({ menu: "mega" })).toThrow();
  });
});

describe("footerSchema", () => {
  it("10 талбартай, сошиал холбоос https байх", () => {
    const f = footerSchema.parse({ addr: "УБ", fb: "facebook.com/x" });
    expect(Object.keys(f).sort()).toEqual(
      ["about","addr","email","fb","ig","phone","policy","sales","x","yt"],
    );
    expect(f.fb).toBe("https://facebook.com/x");
    expect(footerSchema.parse({ fb: "javascript:alert(1)" }).fb).toBe("");
  });
});

describe("weatherSchema", () => {
  it("null зөвшөөрнө, хотын нэр default", () => {
    expect(weatherSchema.parse(null)).toBeNull();
    expect(weatherSchema.parse({ t: -18 })).toEqual({ city: "Улаанбаатар", t: -18, icon: "sun", text: "" });
  });
});

describe("feedSchema", () => {
  it("rss default нь нээлттэй, fxapi https байх", () => {
    expect(feedSchema.parse({})).toEqual({ rss: true, fxSource: "", fxApi: "" });
    expect(feedSchema.parse({ fxApi: "http://x.mn" }).fxApi).toBe("");
  });
});
```

- [ ] **Step 2: Тест унаж байгааг шалгах**

Run: `pnpm --filter @nuul/news test settings`
Expected: FAIL.

- [ ] **Step 3: `lib/settings.ts`-ийг хэрэгжүүлэх**

`headerSchema` — `pos: enum(["left","center"]).default("left")`, `size: number().default(30)` дээр `clamp(20, 56)` (`.catch`/`transform`), `tagline: string().max(48).default("")`, `menu: enum(["inline","below","burger"]).default("inline")`.
`footerSchema` — `addr, phone, email, sales, about, policy` чөлөөт текст; `fb, yt, ig, x` — схемгүй бол `https://` нэмж, `^https:\/\/[^\s"'<>]+$` таарахгүй бол `""`. Бүгд `.default("")`.
`weatherSchema` — `z.null().or(z.object({ city: default "Улаанбаатар", t: number(), icon: string().default("sun"), text: string().default("") }))`.
`feedSchema` — `rss: boolean().default(true)`, `fxSource: string().default("")`, `fxApi` — https биш бол `""`.
`getSetting` / `putSetting` — `db.tenantSetting.findFirst({ where: { key } })` / `findFirst` + `create`/`updateMany` (Task 5 `upsert`-ийг хориглодог).

- [ ] **Step 4: Тест ажиллахыг шалгах**

Run: `pnpm --filter @nuul/news test settings`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/parliament-news/lib/settings.ts apps/parliament-news/lib/settings.test.ts
git commit -m "feat(news): zod-validated tenant settings for header, footer, weather and feed"
```

---

### Task 10: Seed — Gerel News tenant ба анхны супер админ

**Files:**
- Create: `packages/db/prisma/seed-news.ts`
- Modify: `packages/db/package.json` (`"db:seed:news": "dotenv -e ../../.env -- tsx prisma/seed-news.ts"`)

**Interfaces:**
- Consumes: Task 2–4-ийн моделиуд
- Produces: `parlament` slug-тай tenant, 8 ангилал, `LiveState`, 4 тохиргооны мөр, 1 супер админ гишүүн

- [ ] **Step 1: Seed скриптийг бичих**

`packages/db/prisma/seed.ts`-ийн хэв шинжээр, гэхдээ **`deleteMany` хийхгүй** — зөвхөн `upsert`/`findFirst`+`create`. Нүцгэн `prisma`-г хэрэглэнэ (extension нь аппын давхарга).
- `Tenant`: `slug: "parlament"`, `name: "Parliament News"`, `domains: ["parlamentnews.mn", "www.parlamentnews.mn", "parlament.localhost"]`, `brandColor: "#1d3fe3"`, `accentColor: "#f26a1b"`.
- `NewsCategory` × 8 — `admin.html`-ийн `DEFC`. `packages/db` нь аппын `lib/slug.ts`-ээс import хийхгүй тул slug-ийг яг ийм гараар бичнэ (`order` нь дараалал, `inMenu` нь гурван ангиллын хувьд `true`):
  `chuulgan`/Чуулган ✓цэс · `khuuliin-medee`/Хуулийн мэдээ ✓цэс · `baingiin-khoroo`/Байнгын хороо · `tosov`/Төсөв · `gadaad-khariltsaa`/Гадаад харилцаа · `niigem`/Нийгэм · `ediin-zasag`/Эдийн засаг · `video`/Видео ✓цэс
- `LiveState`: `attendance: 0`, `sessionStatus: "Хуралдаж байна"`, `tickerOn: true`.
- `TenantSetting` × 4: `header`, `footer`, `weather`, `feed` — Task 9-ийн схемийн default (`weather` нь `null`).
- **Супер админ:** `ADMIN_EMAIL` env (заавал — байхгүй бол ойлгомжтой алдаагаар таслана). Тэр имэйлтэй `User` байхгүй бол үүсгэнэ: `ADMIN_PASSWORD` env байвал `bcryptjs`-ээр hash хийнэ, байхгүй бол 16 тэмдэгтийн random нууц үг зохиож hash хийгээд **зөвхөн терминал дээр нэг удаа хэвлэнэ** (кодонд, DB-д, лог файлд ил нууц үг бичихгүй). Дараа нь `TenantMember { role: SUPER, active: true }` upsert.

- [ ] **Step 2: Seed-ийг ажиллуулах**

Run: `cd packages/db && ADMIN_EMAIL=<эзэмшигчийн имэйл> pnpm db:seed:news`
Expected: алдаагүй; tenant, 8 ангилал, тохиргоо, супер админ бэлэн болсон лог.

- [ ] **Step 3: Өгөгдөл орсныг шалгах**

Run: `cd packages/db && pnpm exec tsx -e "import {PrismaClient} from '@prisma/client';const p=new PrismaClient();p.tenant.findUnique({where:{slug:'parlament'},include:{_count:{select:{members:true,categories:true,settings:true}}}}).then(t=>console.log(JSON.stringify(t,null,2))).finally(()=>p.\$disconnect())"`
Expected: `domains`-д `parlamentnews.mn`, `members: 1`, `categories: 8`, `settings: 4`.

- [ ] **Step 4: Дахин ажиллуулахад давхардахгүйг шалгах**

Run: `cd packages/db && ADMIN_EMAIL=<адил имэйл> pnpm db:seed:news`
Expected: алдаагүй, ангилал 8, гишүүн 1 хэвээр (upsert), шинэ нууц үг хэвлэгдэхгүй.

- [ ] **Step 5: Бүх тест ба build**

Run: `pnpm --filter @nuul/news test && pnpm --filter @nuul/news build && pnpm --filter @nuul/web build`
Expected: бүгд PASS — `apps/web` эвдрээгүйг батална.

- [ ] **Step 6: Commit**

```bash
git add packages/db/prisma/seed-news.ts packages/db/package.json
git commit -m "feat(db): seed Gerel News tenant, categories, settings and super admin"
```

---

## Дараах шат

1-р шат дуусахад `apps/parliament-news` build болж, `parlament.localhost:3001` дээр tenant танигдаж, tenant тусгаарлалт DB тестээр батлагдаж, эрхийн модуль тесттэй, Gerel News-ийн өгөгдөл DB-д байна. Дараа нь **2-р шат: нийтийн сайт + SEO** (`/news/<slug>`, `NewsSlugRedirect`-ийн 301, нүүр, ангилал, хайлт, sitemap/RSS/OG) өөрийн төлөвлөгөөтэй болно.

Энэ шатанд **ороогүй** зүйлс (зориуд): Tiptap редактор, медиа байршуулалт, CMS-ийн дэлгэцүүд, 3D номын тавиур, сошиал нийтлэл, 2FA, Vercel project тохиргоо, цаг агаар/ханшийн гадаад API дуудлага.
