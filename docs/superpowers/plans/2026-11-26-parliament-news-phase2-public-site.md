# Parliament News 2-р шат — нийтийн сайт ба SEO (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `parlamentnews.mn`-ийн нийтийн хэсгийг ажиллуулах — нүүр (3D номын тавиур), `/news/<slug>`, ангилал, таг, хайлт, sitemap/RSS/OG — бүх хуудас SSR, мэдээ бүр өөрийн хаягтай, нийтлээгүй мэдээ хэзээ ч харагдахгүй.

**Architecture:** Artifact-ийн номын хавтас нь `cover(n)` гэсэн цэвэр функц — 474×900 SVG тэмдэгт мөр үүсгэдэг. Үүнийг TypeScript-д порт хийснээр хавтас **сервер дээр** рендерлэгдэж, нэг код нь тавиур, нийтлэлийн хуудас, Open Graph зураг гурвуулангийг хангана. 3D тавиур нь зөвхөн тэр хавтаснуудыг байрлуулдаг нимгэн client component болж, доороо SSR-ийн семантик `<article>` жагсаалт үлдэнэ — JS унтарсан ч, зөөлөн хайлтын робот ч агуулгыг хардаг. Өгөгдлийн уншилт бүр `lib/posts.ts`-ийн нэг хаалгаар дамжиж, тэр хаалга нь `forTenant()`-аар tenant-д хаагдсан, `status=PUBLISHED AND publishedAt <= now()` гэсэн нэг нөхцөлийг хэрэглэнэ.

**Tech Stack:** Next.js 14.2 App Router (RSC + ISR), React 18.3, TypeScript 5.5 strict, Tailwind 3.4 + CSS modules (3D тавиурт), Prisma 5.22 (`@nuul/db-news`), Vitest 2.

**Spec:** `docs/superpowers/specs/2026-11-25-parliament-news-platform-design.md`
**1-р шатны шийдвэрүүд:** `docs/superpowers/plans/2026-11-25-parliament-news-phase1-ledger.md`

---

## Global Constraints

Эдгээр нь даалгавар бүрийн шаардлагад далд орсон гэж үзнэ.

- Монорепо: pnpm + turbo, Next.js 14 App Router, Prisma 5, NextAuth 4, Postgres, Vercel.
- **`apps/web` (nuul.mn, 53 хуудас) эвдрэхгүй.** `packages/db`, `apps/web`-д хүрэхгүй. Даалгавар бүрийн төгсгөлд `pnpm --filter @nuul/web build` ногоон байхыг шалгана.
- Хэрэглэгчийн интерфэйс **бүхэлдээ монгол хэл**. Кирилл гарчгаас латин slug — `lib/slug.ts` аль хэдийн байна, дахин бичихгүй.
- **Artifact-ийн JS-ийг хуулж зөөхгүй** (anti-goal). `cover`/`motif`-ийг цэвэр функц болгон тестийн дор порт хийнэ; тавиурын CSS-ийг нэг CSS module-д, 200 мөрөөс дотогш; `index.html`-ээс `<script>` блок хуулахгүй.
- **Мэдээ бүрт өөрийн URL** (anti-goal: нэг хуудасны SPA болохгүй).
- Контентын query бүр `forTenant(ctx.tenantId)`-ээр — `prisma.newsPost` руу шууд хандахгүй. Шинэ модель нэмбэл `lib/tenant-db.ts`-ийн `TENANT_MODELS`-д бас нэмнэ.
- `$queryRaw` / `$executeRaw` / `*Unsafe` хориотой — `.eslintrc.json` барина.
- Шинэ dependency нэмбэл `pnpm-lock.yaml`-ийг **мөн тэр commit-д** оруулна (Vercel `--frozen-lockfile`-тай тул хоцрогдсон lockfile нь nuul.mn-ийн deploy-г ч унагана).
- Дизайний токен (artifact-аас үг дуудлагаар): цайвар `--paper:#ECE8E0`, `--sheet:#F3F0EA`, `--ink:#141414`, `--muted:#6D6A63`, `--cob:#0A22E0`, `--red:#E86522`, `--rule:rgba(20,20,20,.9)`; бараан `--paper:#0E1426`, `--sheet:#131B31`, `--ink:#ECE8E0`, `--muted:#9AA1B6`, `--cob:#9AAAFF`, `--red:#FF8A4C`, `--rule:rgba(236,232,224,.75)`.
- Фонт: `Inter+Tight:wght@500;600;700;800`, `Noto+Serif:ital,wght@0,400;1,400`, `PT+Serif:wght@700`.
- Хавтасны палитр (`PAL`, artifact-аас үг дуудлагаар, `NewsPost.theme` нь индекс):
  `[['#0A22E0','#F3F0EA','#E86522'], ['#F3F0EA','#0A22E0','#E86522'], ['#E86522','#F3F0EA','#0A22E0']]`
- Нийтийн хуудас бүр ISR: `export const revalidate = 300`. Кэшийн таг ба нийтлэх үеийн хүчингүй болголт нь 3-р шат (Task 3-ийн кэшийн шийдвэрийг үз).
- Нээлт 2027-01-01.

---

## Review Focus

Дизайн бичиг нь юу хийх ёстойг хэлдэг, тааралдах бүх оролтыг хэлдэггүй. Доорх 5 нь түүний далд шаардлага боловч ямар ч даалгаврын тест өөрөө хөндөхгүй байж магадгүй зүйлс — хүнд хамгийн их хоруулж болох дарааллаар. Мөр бүрийн тестийг эзэн даалгаварт нэмсэн.

1. **Нийтлээгүй мэдээг шууд slug-аар гуйх.** `DRAFT`/`REVIEW`/`APPROVED`/`RETURNED` мэдээ, эсвэл `publishedAt` нь ирээдүйд байгаа (цаг товлосон) мэдээг `/news/<slug>`-аар гуйвал **404** — рендерлэх нь редакцын дотоод материалыг нийтэд тараана. → Task 3 (query), Task 7 (хуудас).
2. **Slug нь хуучин утга руугаа буцсан (A→B→A).** `NewsSlugRedirect` нь `fromSlug → postId` хадгалдаг тул гинж байхгүй, гэхдээ мэдээний **одоогийн** slug-тай тэнцэх redirect мөр үлдвэл хуудас өөр дээрээ 301 хийж тэнцвэргүй цикл үүснэ. Шийд: гуйсан slug нь олдсон мэдээний одоогийн slug-тай тэнцвэл **redirect хийхгүй, рендерлэнэ**. → Task 7.
3. **Кирилл болон percent-encoded таг/хайлтын үг.** `/tag/Чуулган`, `/search?q=хууль%20төсөл` зэрэг нь 500 буцаахгүй, зөв decode хийгдэж query-д орно. Хоосон эсвэл зөвхөн зайтай `q` → хоосон үр дүнгийн хуудас, бүх мэдээг буцаахгүй. 200 тэмдэгтээс урт `q` → хайлт хийхгүй, хоосон үр дүн. → Task 3 (хайлт), Task 9 (хуудас).
4. **RSS ба sitemap-д зөвхөн нийтлэгдсэн мэдээ, зөв escape.** Гарчигт `&`, `<`, `"` байвал XML хугарахгүй; цаг товлосон мэдээ sitemap-д орохгүй; `lastmod` нь `updatedAt`. → Task 10.
5. **Зураггүй мэдээний OG зураг.** Media байхгүй мэдээнд `cover()` нь `motif`-оор эргэж, OG зураг 1200×630-д хүчинтэй PNG/SVG гаргана — хоосон эсвэл 500 болохгүй. Мөн 200 тэмдэгтийн гарчиг 5 мөрөөр тасарна. → Task 2 (cover), Task 10 (OG).

---

## Хэмжигдэх зорилт — Монголын мэдээний сайтуудтай харьцуулсан

2026-11-26-нд Улаанбаатараас хэмжсэн. Эдгээр нь бодит тоо, таамаг биш: нийтлэлийн
хуудас татаж, `og:image`-ийг `Accept: image/webp` -тэй ба түүнгүй хоёр удаа гуйж,
TTFB-г гурван удаа дундажлав.

| | ikon.mn | gogo.mn | news.mn | eagle.mn | **бидний зорилт** |
|---|---|---|---|---|---|
| Технологи | өөрийн | Next.js | WordPress | Next.js | Next.js |
| TTFB (нүүр) | 93 мс | 68 мс | 1244 мс | 439 мс | **< 150 мс** |
| HTML (нийтлэл) | 59 KB | 207 KB | 900 KB | 82 KB | **< 100 KB** |
| `<script>` тоо | 5 | 30 | 34 | 32 | **< 12** |
| Гол зураг | 296 KB JPEG | 335 KB JPEG | 466 KB JPEG | — | **< 120 KB WebP** |
| `Accept: webp` дээр WebP? | үгүй | үгүй | үгүй | үгүй | **тийм** |
| `srcset` | 0 | 14 | 48 | 4 | **бүх зурагт** |
| JSON-LD (нийтлэл) | 0 | 2 | 1 | 0 | **1 (`NewsArticle`)** |

**Юуг нь уншиж байна:**

- **ikon.mn бол хурдны хэмжүүр**, news.mn биш. 93 мс TTFB, 59 KB HTML, ердөө 5
  script. Биднийх Next.js App Router тул First Load JS аль хэдийн ~87 KB —
  хүнд client сан нэмэх боломж бага. Script-ийн тоог 12-оос доогуур барина.
- **Зургийн давуу тал бол хамгийн хямд, хамгийн том.** Дөрвүүлэнгийн хэн нь ч
  WebP үйлчлэхгүй, `Vary: Accept` header ч тавихгүй — хүсэлт нь WebP гуйсан ч
  300–470 KB JPEG буцаана. `next/image` нь WebP/AVIF-ийн content negotiation ба
  responsive `srcset`-ийг автоматаар хийдэг тул гурав дахин жижиг зураг нь
  framework-ээс үнэгүй ирнэ. Монголын мэдээний хөдөлгөөний дийлэнх нь
  мобайл дээр байдаг тул энэ нь уншигчид бодитоор мэдрэгдэх зөрүү. → Task 6.
- **JSON-LD-ийн талаарх анхны дүгнэлт буруу байсан:** нүүр хуудсыг шалгаж
  «хэн ч JSON-LD хийдэггүй» гэж бодсон. Нийтлэлийн хуудсыг хэмжихэд gogo.mn 2,
  news.mn 1 байна. Энэ нь хоосон зай биш, зөв хийх ёстой зүйл — ikon.mn,
  eagle.mn-д байхгүй тул дээд хагаст орох боломж байна.
- **WordPress-ийн төлбөр харагдаж байна:** news.mn 900 KB HTML, 1244 мс TTFB.
  Гэхдээ SEO-ийн тэмдэглэгээгээр (48 `srcset`, 10 OG, JSON-LD) тэр л хамгийн
  бүрэн — плагин нь түүнийг автоматаар хийж байна. Бидний давуу тал framework
  сонголтоос биш, Task 6 ба Task 10-ийн ажлыг үнэхээр хийснээс гарна.

**Хостингийн сануулга (архитектурын эрсдэл, Task-ийн гадна):**
`montsame.mn` нь Vercel дээр, Монголоос **385 мс TTFB** (кэш оногдсон байхад ч) —
`X-Vercel-Id: hkg1`, өөрөөр хэлбэл хамгийн ойрын edge нь Хонг Конг. Дотоодод
байршсан ikon.mn 93 мс, gogo.mn 68 мс. Зөвхөн Vercel дээр бол бид 4 дахин хоцрох
болно.

Cloudflare-д **Улаанбаатарт POP байна** (`colo=ULN`, `loc=MN` — шалгасан).
Нийтийн хуудсууд бүгд ISR/статик, хэрэглэгчээр хувьсдаггүй тул CDN-ийн edge-д
кэшлэгдэж чадна — нэг сайт болгож `/`-ийг статик болгосны бодит үнэ цэн нь энэ.
Cloudflare-ийг Vercel-ийн урд тавьж HTML-ийг ULN дээр кэшлэвэл Монголын
уншигчид ~50 мс-д хүрнэ.

Анхаар: zarig.mn, eagle.mn хоёул Cloudflare дээр байгаа боловч
`cf-cache-status: DYNAMIC` — HTML кэшлэгдэхгүй тул хүсэлт бүр origin хүртэл явж
байна (188 мс, 439 мс). Cloudflare-ийг зүгээр урд тавих нь хүрэлцэхгүй, HTML-ийг
кэшлэх дүрэм зориуд бичих шаардлагатай.

Энэ нь **хоёр давхар кэшийн хүчингүй болголтын** асуудал үүсгэнэ: нийтлэхэд
Vercel-ийн ISR ба Cloudflare-ийн кэш хоёуланг нь цэвэрлэх ёстой. Тиймээс
2-р шатад Cloudflare-ийг HTML кэштэйгээр тавихгүй — редакцын нийтлэх үйлдэл
гарч ирэх 3-р шатад, cache purge-тэй хамт нэг хянагдах өөрчлөлтөд оруулна.
2-р шатны TTFB-ийн зорилтыг Vercel-ийн hkg1-ээс хэмжиж, 385 мс-ийг эхлэлийн
тоо гэж тэмдэглэнэ.

---

## Файлын бүтэц

```
apps/parliament-news/
  lib/
    cover.ts          хавтасны SVG — wrap/isLight/palette/motif/coverSvg (цэвэр)
    cover.test.ts
    posts.ts          нийтийн уншилтын ЦОРЫН ГАНЦ хаалга
    posts.test.ts     цэвэр хэсэг (publishedWhere, searchTerm)
    posts.db.test.ts  ноорог/цаг товлосон мэдээ харагдахгүйг DB-гээр
    format.ts         монгол огноо, тоо, унших хугацаа (цэвэр)
    format.test.ts
    seo.ts            metadata, canonical, RSS/sitemap-ийн XML (цэвэр)
    seo.test.ts
    images.ts         зургийн хувилбар, sizes, safeImageSrc (цэвэр)
    images.test.ts
    image-hosts.js    зөвшөөрөгдөх host — next.config.js БА images.ts хоёул уншина
  components/
    site-header.tsx   лого, цэс, шуурхай мөр — getSetting("header")-ээс
    site-footer.tsx   getSetting("footer")-ээс
    post-card.tsx     жагсаалтын нэгж (нүүр, ангилал, таг, хайлтад дахин хэрэглэнэ)
    post-image.tsx    next/image-ийн бүрхүүл — WebP/AVIF, srcset, хавтас руу эргэх
    article-body.tsx  нийтлэлийн биет
    shelf.tsx         3D тавиур (client) — SSR жагсаалтын дээр hydrate
    shelf.module.css  тавиурын 3D CSS (artifact-аас порт)
    shelf-model.ts    тавиурын цэвэр өгөгдөл бэлтгэгч (client-гүй, тесттэй)
    shelf-model.test.ts
  app/
    layout.tsx        ЗАСНА: фонт, токен, metadataBase
    globals.css       ЗАСНА: artifact-ийн токенууд
    page.tsx          ЗАСНА: нүүр
    news/[slug]/page.tsx
    news/[slug]/opengraph-image.tsx
    c/[slug]/page.tsx
    tag/[tag]/page.tsx
    search/page.tsx
    rss.xml/route.ts
    sitemap.ts
    robots.ts
  tailwind.config.ts  ЗАСНА: токенууд
  next.config.js      ЗАСНА: images (WebP/AVIF, remotePatterns)
  public/demo/        демо зураг (site-v2-ээс хуулсан)
packages/db-news/
  prisma/seed-demo.ts ДЕМО контент (нийтийн сайтыг харахад)
```

**Шийдвэр:** `post-card.tsx` нь нүүр, ангилал, таг, хайлт дөрвүүлэнд үйлчилнэ — дөрвөн ижил карт бичихгүй (DRY). `shelf-model.ts` нь `shelf.tsx`-ээс тусдаа байгаа нь зориуд: client component-ийг vitest-д рендерлэхгүйгээр тавиурын логикийг тестлэх боломж (репод `@testing-library/react` байхгүй, зөвхөн ийм учраас нэмэхгүй).

---

## Task 1: Монгол форматлагчид ба SEO-ийн цэвэр хэрэгслүүд

Бусад бүх даалгавар эдгээрийг хэрэглэнэ, тиймээс эхлээд. DB, React шаардахгүй — хамгийн хямд, хамгийн өндөр хөшүүрэгтэй.

**Files:**
- Create: `apps/parliament-news/lib/format.ts`
- Create: `apps/parliament-news/lib/format.test.ts`
- Create: `apps/parliament-news/lib/seo.ts`
- Create: `apps/parliament-news/lib/seo.test.ts`

**Interfaces:**
- Consumes: юу ч үгүй.
- Produces:
  - `mnDate(d: Date): string` — `"2026 оны 11 дүгээр сарын 26"`
  - `mnShortDate(d: Date): string` — `"11.26"` (тавиурын шошгонд)
  - `mnDateTime(d: Date): string` — `"11.26 14:30"`
  - `readMinutes(body: string | null): number` — минут, доод тал 1
  - `excerpt(text: string | null, max: number): string` — үгийн зааг дээр тасалж `"…"`
  - `xmlEscape(s: string): string` — `& < > " '` → entity
  - `absoluteUrl(path: string, base: string): string`
  - `metaDescription(lead: string | null, body: string | null): string` — 155 тэмдэгт

- [ ] **Step 1: Write the failing tests** — `lib/format.test.ts`

```ts
describe("mnDate", () => {
  it("монгол бичгээр бүтэн огноо", () => {
    expect(mnDate(new Date("2026-11-26T00:00:00Z"))).toBe("2026 оны 11 дүгээр сарын 26");
  });
  it("1-р сар нь «1 дүгээр»", () => {
    expect(mnDate(new Date("2027-01-01T00:00:00Z"))).toBe("2027 оны 1 дүгээр сарын 1");
  });
});

describe("mnShortDate", () => {
  it("сар.өдөр", () => {
    expect(mnShortDate(new Date("2026-11-26T00:00:00Z"))).toBe("11.26");
  });
});

describe("readMinutes", () => {
  it("200 үг → 1 минут", () => {
    expect(readMinutes(Array(200).fill("үг").join(" "))).toBe(1);
  });
  it("600 үг → 3 минут", () => {
    expect(readMinutes(Array(600).fill("үг").join(" "))).toBe(3);
  });
  it("хоосон бол 1", () => {
    expect(readMinutes(null)).toBe(1);
    expect(readMinutes("")).toBe(1);
  });
});

describe("excerpt", () => {
  it("үгийн зааг дээр тасална", () => {
    expect(excerpt("Чуулганы нэгдсэн хуралдаан", 12)).toBe("Чуулганы…");
  });
  it("багтаж байвал хөндөхгүй", () => {
    expect(excerpt("Товч", 12)).toBe("Товч");
  });
  it("null → хоосон", () => {
    expect(excerpt(null, 10)).toBe("");
  });
});
```

`mnDate`-ийн «дүгээр/дугаар» нь сарын тооны дуудлагын эгшиг зохицлоор тогтоно:

| | сар |
|---|---|
| **дүгээр** | 1 (нэгдүгээр), 4 (дөрөвдүгээр), 9 (есдүгээр), 11 (арван нэгдүгээр) |
| **дугаар** | 2, 3, 5, 6, 7, 8, 10, 12 (хоёрдугаар, гуравдугаар, тавдугаар, зургаадугаар, долоодугаар, наймдугаар, аравдугаар, арван хоёрдугаар) |

Дээрх тест зөвхөн 11 ба 1-ийг тогтоож байгаа тул хоёр багцаас тус бүр хоёрыг нэмж тест болгоно: 2 → `"2 дугаар"`, 7 → `"7 дугаар"`, 9 → `"9 дүгээр"`, 12 → `"12 дугаар"`. Кодод нь 12 мөрт `MONTH_ORDINAL: Record<number, string>` хүснэгтээр бич — эгшиг зохицлыг алгоритмаар тооцохгүй.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/format.test.ts`
Expected: FAIL — `mnDate is not a function` (модуль байхгүй)

- [ ] **Step 3: Implement `lib/format.ts`**

`readMinutes` нь 200 үг/мин. `excerpt` нь хязгаараас хэтэрвэл эцсийн бүтэн үг хүртэл тасалж `"…"` нэмнэ.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/format.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing tests** — `lib/seo.test.ts`

```ts
describe("xmlEscape", () => {
  it("XML-ийн таван тэмдэгт", () => {
    expect(xmlEscape(`АН & МАН <b> "хоёр" 'гурав'`))
      .toBe("АН &amp; МАН &lt;b&gt; &quot;хоёр&quot; &apos;гурав&apos;");
  });
  it("кирилл хөндөгдөхгүй", () => {
    expect(xmlEscape("Чуулган")).toBe("Чуулган");
  });
});

describe("absoluteUrl", () => {
  it("base-тэй залгана", () => {
    expect(absoluteUrl("/news/tosov", "https://parlamentnews.mn"))
      .toBe("https://parlamentnews.mn/news/tosov");
  });
  it("base-ийн төгсгөлийн зураас давхардуулахгүй", () => {
    expect(absoluteUrl("/news/tosov", "https://parlamentnews.mn/"))
      .toBe("https://parlamentnews.mn/news/tosov");
  });
});

describe("metaDescription", () => {
  it("lead байвал түүнээс", () => {
    expect(metaDescription("Товч тайлбар", "Биет")).toBe("Товч тайлбар");
  });
  it("lead байхгүй бол биетээс 155 тэмдэгт", () => {
    const body = "а".repeat(400);
    expect(metaDescription(null, body).length).toBeLessThanOrEqual(156);
  });
  it("хоёулаа хоосон бол хоосон", () => {
    expect(metaDescription(null, null)).toBe("");
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/seo.test.ts`
Expected: FAIL — `xmlEscape is not a function`

- [ ] **Step 7: Implement `lib/seo.ts`**

`xmlEscape` нь `&`-ийг ХАМГИЙН ЭХЭНД сольж, дараа нь бусдыг (эс бөгөөс `&lt;` нь `&amp;lt;` болно). `metaDescription` нь `excerpt`-ийг дахин хэрэглэнэ.

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/format.test.ts lib/seo.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add apps/parliament-news/lib/format.ts apps/parliament-news/lib/format.test.ts \
        apps/parliament-news/lib/seo.ts apps/parliament-news/lib/seo.test.ts
git commit -m "feat(news): Mongolian date/excerpt formatters and SEO string helpers"
```

---

## Task 2: Номын хавтасны SVG — artifact-ийн `cover()`-ийн цэвэр порт

Энэ нь 2-р шатны хамгийн өндөр үнэ цэнтэй нэгж: нэг модуль нь тавиур, нийтлэлийн хуудас, OG зураг гурвуулангийн дүрслэлийг хангана. Эх сурвалж: `site-v2/admin.html:813-842` (`ICP`, `PAL`, `wrap`, `motif`, `pal`, `light`, `cover`). Тэр кодыг **хуулахгүй**, тестийн дор дахин бичнэ — JS нь `n.t/n.k/n.c/n.m/n.th/n.look/n.img/n.feat` гэсэн гар бичмэлийн талбаруудыг хэрэглэдэг тул Prisma-ийн нэрс рүү хөрвүүлнэ.

**Files:**
- Create: `apps/parliament-news/lib/cover.ts`
- Create: `apps/parliament-news/lib/cover.test.ts`

**Interfaces:**
- Consumes: Task 1-ийн `xmlEscape` (SVG текст мөн escape шаардана).
- Produces:
  ```ts
  export type Motif = "grid" | "hemi" | "cols" | "bars" | "rings" | "sun" | "wave";
  export type CoverLook = {
    bg?: string; fg?: string; ac?: string;
    lay?: "top" | "full" | "text";
    size?: number; font?: "sans" | "serif";
    fy?: number; duo?: boolean;
  };
  export type CoverInput = {
    title: string; kicker: string | null; lead: string | null;
    categoryName: string; motif: string; theme: number;
    look: CoverLook | null; imageUrl: string | null; featured: boolean;
  };
  export const COVER_W = 474;
  export const COVER_H = 900;
  export const PALETTES: ReadonlyArray<readonly [string, string, string]>;
  export function wrapLines(text: string, perLine: number, max?: number): string[];
  export function isLight(hex: string): boolean;
  /** NewsPost.look нь Json? — дурын бүтэц. Энэ нь шалгаж цэвэрлэсэн CoverLook эсвэл null буцаана. */
  export function parseLook(value: unknown): CoverLook | null;
  export function palette(theme: number, look: CoverLook | null): [string, string, string];
  export function motifSvg(kind: string, fg: string, ac: string): string;
  export function coverSvg(input: CoverInput): string;   // <svg>...</svg> бүтэн
  export function coverInner(input: CoverInput): string; // <svg>-гүй, дотор нь
  ```

- [ ] **Step 1: Write the failing tests** — `lib/cover.test.ts`

```ts
describe("isLight", () => {
  it("цайвар дэвсгэр", () => {
    expect(isLight("#F3F0EA")).toBe(true);
  });
  it("бараан дэвсгэр", () => {
    expect(isLight("#0A22E0")).toBe(false);
  });
  it("artifact-ийн хязгаар нь 150/1000", () => {
    // (r*299 + g*587 + b*114)/1000 > 150
    expect(isLight("#969696")).toBe(true);   // 150.0 биш, 150-аас дээш
    expect(isLight("#000000")).toBe(false);
    expect(isLight("#FFFFFF")).toBe(true);
  });
});

describe("palette", () => {
  it("theme нь PALETTES-ийн индекс", () => {
    expect(palette(0, null)).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
    expect(palette(1, null)).toEqual(["#F3F0EA", "#0A22E0", "#E86522"]);
    expect(palette(2, null)).toEqual(["#E86522", "#F3F0EA", "#0A22E0"]);
  });
  it("хүрээнээс гарсан theme → 0-р палитр", () => {
    expect(palette(9, null)).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
    expect(palette(-1, null)).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
  });
  it("look-ийн зөв hex нь палитрыг дарна", () => {
    expect(palette(0, { bg: "#112233" })).toEqual(["#112233", "#F3F0EA", "#E86522"]);
  });
  it("хүчингүй hex-ийг үл хэрэгсэнэ", () => {
    expect(palette(0, { bg: "red" })).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
    expect(palette(0, { bg: "#FFF" })).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
  });
});

describe("parseLook", () => {
  it("null, undefined, тоо, массив, мөр → null", () => {
    for (const v of [null, undefined, 5, "x", [], true]) {
      expect(parseLook(v)).toBeNull();
    }
  });
  it("танихгүй талбарыг хаяна", () => {
    expect(parseLook({ lay: "top", baahan: "<script>" })).toEqual({ lay: "top" });
  });
  it("хүчингүй утгыг хаяна, зөвийг авна", () => {
    expect(parseLook({ lay: "баахан", size: 1.1 })).toEqual({ size: 1.1 });
    expect(parseLook({ bg: "red", fg: "#112233" })).toEqual({ fg: "#112233" });
    expect(parseLook({ font: "comic" })).toEqual({});
  });
  it("size, fy нь тоо байх ёстой", () => {
    expect(parseLook({ size: "1.1" })).toEqual({});
    expect(parseLook({ fy: Number.NaN })).toEqual({});
  });
});

describe("wrapLines", () => {
  it("үгийн зааг дээр мөр хуваана", () => {
    expect(wrapLines("Чуулганы нэгдсэн хуралдаан хэлэлцэв", 13))
      .toEqual(["Чуулганы", "нэгдсэн", "хуралдаан", "хэлэлцэв"]);
  });
  it("хамгийн ихдээ 5 мөр", () => {
    expect(wrapLines(Array(40).fill("үг").join(" "), 5).length).toBe(5);
  });
  it("нэг урт үгийг хүчээр хувааж мөрөөс гаргахгүй", () => {
    const out = wrapLines("а".repeat(60), 13);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((l) => l.length <= 13)).toBe(true);
  });
});

describe("motifSvg", () => {
  it("7 хэлбэр тус бүр SVG буцаана", () => {
    for (const m of ["grid", "hemi", "cols", "bars", "rings", "sun", "wave"]) {
      expect(motifSvg(m, "#F3F0EA", "#E86522").length).toBeGreaterThan(50);
    }
  });
  it("хэлбэрүүд хоорондоо адилхан биш", () => {
    const all = ["grid", "hemi", "cols", "bars", "rings", "sun", "wave"]
      .map((m) => motifSvg(m, "#F3F0EA", "#E86522"));
    expect(new Set(all).size).toBe(7);
  });
  it("танихгүй хэлбэр нь grid болно", () => {
    expect(motifSvg("баахан", "#F3F0EA", "#E86522"))
      .toBe(motifSvg("grid", "#F3F0EA", "#E86522"));
  });
  it("өнгийг оролтоос авна, өөр өнгө гаргахгүй", () => {
    const s = motifSvg("bars", "#111111", "#222222");
    expect(s).toContain("#111111");
    expect(s).toContain("#222222");
  });
});

describe("coverSvg", () => {
  const base: CoverInput = {
    title: "Төсвийн хэлэлцүүлэг",
    kicker: "ЧУУЛГАН", lead: "Товч агуулга", categoryName: "Төсөв",
    motif: "bars", theme: 0, look: null, imageUrl: null, featured: false,
  };

  it("474×900 viewBox-той бүтэн SVG", () => {
    const s = coverSvg(base);
    expect(s.startsWith("<svg")).toBe(true);
    expect(s).toContain('viewBox="0 0 474 900"');
    expect(s.endsWith("</svg>")).toBe(true);
  });

  it("гарчиг ба ангиллыг агуулна", () => {
    const s = coverSvg(base);
    expect(s).toContain("Төсөв");
    expect(s).toContain("Төсвийн");
  });

  it("зураггүй бол motif-оор эргэнэ", () => {
    const s = coverSvg(base);
    expect(s).toContain("<rect");
    expect(s).not.toContain("<image");
  });

  it("зурагтай бол image, motif-гүй", () => {
    const s = coverSvg({ ...base, imageUrl: "https://ex.mn/a.jpg" });
    expect(s).toContain("<image");
    expect(s).toContain("https://ex.mn/a.jpg");
  });

  it("гарчигт байгаа SVG-д аюултай тэмдэгтийг escape хийнэ", () => {
    const s = coverSvg({ ...base, title: 'АН & МАН <script>alert("x")</script>' });
    expect(s).not.toContain("<script");
    expect(s).toContain("&amp;");
  });

  it("зургийн URL дахь хашилтыг escape хийнэ", () => {
    const s = coverSvg({ ...base, imageUrl: 'https://ex.mn/a.jpg" onload="x' });
    expect(s).not.toContain('onload="x"');
  });

  it("200 тэмдэгтийн гарчиг 5 мөрөөс хэтрэхгүй", () => {
    const s = coverSvg({ ...base, title: "Үг ".repeat(70).trim() });
    const textLines = s.match(/<text[^>]*font-size="(4[0-9]|5[0-9]|6[0-9])"/g) ?? [];
    expect(textLines.length).toBeLessThanOrEqual(5);
  });

  it("featured бол шар тэмдэг", () => {
    expect(coverSvg({ ...base, featured: true })).toContain("#F9CF02");
    expect(coverSvg(base)).not.toContain("#F9CF02");
  });

  it("lay=text бол lead-ийг хавтсанд хэвлэнэ", () => {
    const s = coverSvg({ ...base, look: { lay: "text" } });
    expect(s).toContain("Товч агуулга");
  });

  it("size нь 0.8–1.25-д хавчигдана", () => {
    const small = coverSvg({ ...base, look: { size: 0.1 } });
    const big = coverSvg({ ...base, look: { size: 9 } });
    expect(small).toContain('font-size="35"');  // 44 * 0.8 = 35.2 -> 35
    expect(big).toContain('font-size="55"');    // 44 * 1.25 = 55
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/cover.test.ts`
Expected: FAIL — `isLight is not a function`

- [ ] **Step 3: Implement `lib/cover.ts`**

`site-v2/admin.html:813-842`-ийг уншиж дүрмийг нь гарга, кодыг хуулахгүй. Тогтмолууд үг дуудлагаар: canvas 474×900; `tsz = (lay === "text" ? 58 : 44) * fs`, `lh = tsz * 1.14`; мөрийн урт `round((lay === "text" ? 10.5 : 13) / fs)`; `fs = clamp(0.8, 1.25, look.size || 1)`; лого `x=37 y=22 w=220 h=50`; шугам `rect x=37 y=74 w=400 h=2`; ангилал `x=37 y=116 font-size=22 weight=600`; `top` зураг `x=0 y=132 w=474 h=452`; `full` зураг `w=474 h=900` + градиент; `text` бол `ty = 190 + tsz`; lead `wrapLines(lead, 32)` 5 мөр, `font-size=21`, `Noto Serif`; featured `rect x=300 y=0 w=137 h=34 fill=#F9CF02`; `preserveAspectRatio = "xMidY" + (fy < 34 ? "Min" : fy > 66 ? "Max" : "Mid") + " slice"`; `look.duo !== false` бол duotone `feColorMatrix`+`feComponentTransfer` фильтр.

`wrapLines` нь artifact-ийн `wrap`-аас **нэг зүйлээр өөр**: artifact нь нэг урт үгийг мөрөөс гаргадаг (хавтаснаас халиад гардаг), энд хүчээр хуваана — тест түүнийг тогтоож байна. Энэ зөрүүг кодын тайлбарт бич.

Логог `<use href="#lgD|#lgW">`-ээр биш, `coverInner`-д параметргүй **орхино**: 1-р шатанд логоны `<symbol>` байхгүй. Оронд нь `isLight(bg)`-ээр сонгосон өнгөөр `PARLAMENT NEWS` гэсэн `<text>` бич (`font-size=20 weight=800 letter-spacing=1`). Логоны SVG symbol нь 3-р шатны редакцын брэнд тохиргоотой хамт ирнэ — тэр үед энэ мөрийг солино. Үүнийг `// TODO(3-р шат)` биш, кодын тайлбарт шийдвэр болгон бич.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/cover.test.ts`
Expected: PASS

- [ ] **Step 5: Нүдээр шалгах — 7 motif × 3 палитрыг нэг HTML-д гарга**

Run:
```bash
cd apps/parliament-news && pnpm exec tsx -e "
import { coverSvg } from './lib/cover';
const motifs = ['grid','hemi','cols','bars','rings','sun','wave'];
const cells = motifs.flatMap(m => [0,1,2].map(th => coverSvg({
  title: 'Чуулганы нэгдсэн хуралдаан', kicker: 'ЧУУЛГАН', lead: 'Товч агуулга',
  categoryName: 'Чуулган', motif: m, theme: th, look: null, imageUrl: null, featured: false,
})));
require('fs').writeFileSync('/tmp/covers.html',
  '<div style=\"display:grid;grid-template-columns:repeat(7,160px);gap:8px\">' +
  cells.map(c => c.replace('<svg','<svg width=160')).join('') + '</div>');
"
```
Expected: 21 хавтас — motif бүр өөр, палитр бүр өөр өнгө. Нүдээр хар: текст хавтаснаас халиагүй, гарчиг уншигдана. Хэрэв халиасан бол `wrapLines`-ийн мөрийн урт буруу.

- [ ] **Step 6: Commit**

```bash
git add apps/parliament-news/lib/cover.ts apps/parliament-news/lib/cover.test.ts
git commit -m "feat(news): port the artifact book-cover SVG as pure, tested functions"
```

---

## Task 3: Нийтийн уншилтын хаалга — `lib/posts.ts`

Нийтлээгүй мэдээ харагдахгүй гэдэг нь энэ шатны гол хамгаалалт. Тиймээс нөхцөл нь **нэг газар** байна: `publishedWhere()`. Хуудас бүр өөрийн `where` бичихийг зөвшөөрөхгүй.

**Files:**
- Create: `apps/parliament-news/lib/posts.ts`
- Create: `apps/parliament-news/lib/posts.test.ts`
- Create: `apps/parliament-news/lib/posts.db.test.ts`
- Modify: `apps/parliament-news/package.json` — `test:db` нь `lib/*.db.test.ts` бүгдийг авна

**Interfaces:**
- Consumes: `forTenant(tenantId)` (`lib/tenant-db.ts`), `requireTenant()` (`lib/tenant.ts`), `parseLook` ба `CoverLook` төрөл (Task 2-ийн `lib/cover.ts`).
- Produces:
  ```ts
  export function publishedWhere(now?: Date): { status: "PUBLISHED"; publishedAt: { not: null; lte: Date } };
  export function searchTerm(raw: string | undefined): string | null; // хэвлэх, хязгаарлах

  /**
   * ХАВТГАЙ төрөл, Prisma-ийн include-ийн бүтэц биш. Шалтгаан: cover.ts-ийн
   * CoverInput, shelf-model.ts, post-card.tsx, rss/sitemap дөрвүүлэн нэг
   * хэлбэрийг хүлээнэ. `category.name`, `media[]` гэсэн бүтэц хуудас руу
   * гарахгүй — хөрвүүлэлт нь зөвхөн toListItem-д.
   */
  export type PostListItem = {
    slug: string;
    title: string;
    kicker: string | null;
    lead: string | null;
    date: Date;               // NewsPost.date (@db.Date) — дүрслэлийн огноо
    publishedAt: Date;        // хаалга null-ийг гаргахгүй тул non-null
    updatedAt: Date;          // sitemap-ийн lastmod
    categorySlug: string | null;
    categoryName: string;     // ангилалгүй мэдээнд "Мэдээ"
    tags: string[];
    reporter: string | null;
    motif: string;
    theme: number;
    look: CoverLook | null;   // parseLook-оор шалгагдсан, чигээрээ Json биш
    imageUrl: string | null;  // media-ийн order-оор эхнийх
    featured: boolean;
  };

  export type PostFull = PostListItem & {
    body: string | null;
    sources: string[];
    media: { url: string; caption: string | null }[];
  };

  /** Prisma-ийн мөрийг PostListItem болгоно — ЦОРЫН ГАГЦ хөрвүүлэх газар */
  export function toListItem(row: PostRow): PostListItem;
  export function listPosts(opts: { take?: number; skip?: number; featured?: boolean }): Promise<PostListItem[]>;
  export function countPosts(opts?: { categorySlug?: string; tag?: string; q?: string }): Promise<number>;
  export function postBySlug(slug: string): Promise<PostFull | null>;
  export function postIdByRedirect(fromSlug: string): Promise<{ postId: string; slug: string } | null>;
  export function postsByCategory(slug: string, opts: { take: number; skip: number }): Promise<PostListItem[]>;
  export function postsByTag(tag: string, opts: { take: number; skip: number }): Promise<PostListItem[]>;
  export function searchPosts(q: string, opts: { take: number; skip: number }): Promise<PostListItem[]>;
  export function menuCategories(): Promise<{ slug: string; name: string }[]>;
  export function allPublishedForFeed(limit: number): Promise<PostListItem[]>;
  ```

- [ ] **Step 1: Write the failing pure tests** — `lib/posts.test.ts`

```ts
describe("publishedWhere", () => {
  it("зөвхөн PUBLISHED, зөвхөн publishedAt нь өнгөрсөн", () => {
    const now = new Date("2026-11-26T10:00:00Z");
    expect(publishedWhere(now)).toEqual({
      status: "PUBLISHED",
      publishedAt: { not: null, lte: now },
    });
  });
  it("now өгөөгүй бол одоогийн цаг", () => {
    const w = publishedWhere();
    expect(w.publishedAt.lte.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe("searchTerm", () => {
  it("зай тайрна", () => {
    expect(searchTerm("  хууль  ")).toBe("хууль");
  });
  it("хоосон, зөвхөн зай, undefined → null", () => {
    expect(searchTerm("")).toBeNull();
    expect(searchTerm("   ")).toBeNull();
    expect(searchTerm(undefined)).toBeNull();
  });
  it("200 тэмдэгтээс урт → null", () => {
    expect(searchTerm("а".repeat(201))).toBeNull();
    expect(searchTerm("а".repeat(200))).not.toBeNull();
  });
  it("кирилл хөндөгдөхгүй", () => {
    expect(searchTerm("хуулийн төсөл")).toBe("хуулийн төсөл");
  });
  it("percent-encoded оролтыг decode хийхгүй — route түүнийг хийнэ", () => {
    expect(searchTerm("%20")).toBe("%20");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/posts.test.ts`
Expected: FAIL — `publishedWhere is not a function`

- [ ] **Step 3: Write the failing DB tests** — `lib/posts.db.test.ts`

Review Focus #1 ба #3-ийн тестүүд. `beforeAll`-д нэг tenant, нэг ангилал, дараах 5 мэдээ үүсгэнэ: `pub` (PUBLISHED, publishedAt өчигдөр), `draft` (DRAFT), `review` (REVIEW), `appr` (APPROVED), `future` (PUBLISHED, publishedAt маргааш). `afterAll`-д tenant-ыг устгана (cascade).

```ts
it("listPosts нь зөвхөн нийтлэгдсэн, цаг нь болсон мэдээг буцаана", async () => {
  const slugs = (await listPosts({ take: 50 })).map((p) => p.slug);
  expect(slugs).toEqual(["pub"]);
});

it("postBySlug нь ноорог, хянагдаж буй, батлагдсан мэдээнд null", async () => {
  for (const s of ["draft", "review", "appr"]) {
    expect(await postBySlug(s)).toBeNull();
  }
});

it("postBySlug нь цаг товлосон мэдээнд null (publishedAt ирээдүйд)", async () => {
  expect(await postBySlug("future")).toBeNull();
});

it("postBySlug нь нийтлэгдсэн мэдээг биеттэй буцаана", async () => {
  const p = await postBySlug("pub");
  expect(p?.slug).toBe("pub");
  expect(p?.body).toContain("биет");
});

it("ангилал, таг, хайлт гурвуулаар нь ноорог гарч ирэхгүй", async () => {
  const byCat = await postsByCategory("chuulgan", { take: 50, skip: 0 });
  const byTag = await postsByTag("төсөв", { take: 50, skip: 0 });
  const byQ = await searchPosts("мэдээ", { take: 50, skip: 0 });
  for (const rows of [byCat, byTag, byQ]) {
    expect(rows.map((r) => r.slug)).not.toContain("draft");
    expect(rows.map((r) => r.slug)).not.toContain("future");
  }
});

it("кирилл тагаар хайна", async () => {
  const rows = await postsByTag("төсөв", { take: 50, skip: 0 });
  expect(rows.map((r) => r.slug)).toEqual(["pub"]);
});

it("хайлт нь том/жижиг үсгийг үл хэрэгсэнэ", async () => {
  const rows = await searchPosts("МЭДЭЭ", { take: 50, skip: 0 });
  expect(rows.map((r) => r.slug)).toEqual(["pub"]);
});

it("allPublishedForFeed мөн цаг товлосон мэдээг гаргахгүй", async () => {
  const slugs = (await allPublishedForFeed(100)).map((p) => p.slug);
  expect(slugs).toEqual(["pub"]);
});
```

- [ ] **Step 4: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/posts.db.test.ts`
Expected: FAIL — модуль байхгүй

- [ ] **Step 5: Implement `lib/posts.ts`**

Функц бүр `requireTenant()` → `forTenant(tenant.id)` → `findMany`. Хайлт нь `OR: [{title: {contains, mode:"insensitive"}}, {lead: {...}}, {body: {...}}]`. Таг нь `tags: { has: tag }`. Эрэмбэ бүр `orderBy: { publishedAt: "desc" }`. `include: { category: { select: { slug: true, name: true } } }` ба `media` нь `postBySlug`-д `orderBy: { order: "asc" }`-тай. `searchPosts` нь `searchTerm()` null буцаавал **хоосон массив** буцаана (бүх мэдээг буцаахгүй) — Review Focus #3.

**Кэшийн шийдвэр — кодын тайлбарт бич.** `unstable_cache`-ийг энд ХЭРЭГЛЭХГҮЙ, кэшийн таг ч тодорхойлохгүй. Шинэлэг байдлын цорын гагц механизм нь хуудас бүрийн `export const revalidate = 300`.

Дизайн бичиг нь «нийтлэхэд `revalidateTag`» гэж хэлдэг. Next-д `revalidateTag` нь **зөвхөн** `unstable_cache(..., { tags })` эсвэл `fetch(..., { next: { tags } })`-ээр тагласан бичлэгийг хүчингүй болгоно — тагтай бичлэг байхгүй үед тэр дуудлага чимээгүй юу ч хийхгүй. Тиймээс тагийг тэднийг дуудах код (CMS-ийн нийтлэх үйлдэл) байхгүй байж тодорхойлох нь хэрэглэгддэггүй тогтмол, хуурамч хамгаалалт болно: нийтлэсэн мэдээ 300 секундээс өмнө гарахгүй байхад таг нь гарах ёстой гэж хэлж байх болно.

Тиймээс таг ба түүний хүчингүй болголтыг **хамтдаа 3-р шатанд** оруулна (`unstable_cache`-ийн таг + редакцын `revalidateTag` дуудлага нэг хянагдах өөрчлөлтөд). 2-р шатны 300 секундийн ISR нь контент өөрөө CMS-гүй үед хүрэлцэнэ. Хэрэв 3-р шатаас өмнө шууд шинэчлэх шаардлага гарвал `revalidatePath("/")` ба `revalidatePath("/news/<slug>")` нь таг шаардахгүй ажиллана.

- [ ] **Step 6: `test:db` нь шинэ файлыг авч байгааг батлах**

`package.json`-ий `test:db` нь одоо `vitest run lib/tenant-db.db.test.ts` гэж **нэг файлыг нэрээр** дууддаг тул шинэ `posts.db.test.ts` түүнд орохгүй. `vitest run "lib/**/*.db.test.ts"` болгоно (хашилт нь shell-ийг glob-ийг өөрөө тайлахаас сэргийлнэ).

Run: `cd apps/parliament-news && pnpm test:db`
Expected: PASS — `tenant-db.db.test.ts` (3) + `posts.db.test.ts` (бүгд), файл 2

- [ ] **Step 7: Run the whole suite**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint`
Expected: бүгд PASS, lint цэвэр

- [ ] **Step 8: Commit**

```bash
git add apps/parliament-news/lib/posts.ts apps/parliament-news/lib/posts.test.ts \
        apps/parliament-news/lib/posts.db.test.ts apps/parliament-news/package.json
git commit -m "feat(news): single public read gate — drafts and scheduled posts cannot leak"
```

---

## Task 4: Демо контент — нийтийн сайтыг харах өгөгдөл

CMS нь 3-р шат тул 2-р шатны хуудсуудад рендерлэх мэдээ байхгүй. Нэг команд нь 12 нийтлэгдсэн мэдээ, 1 ноорог, 1 цаг товлосон мэдээ үүсгэнэ — ноорог ба цаг товлосон нь **нүдээр** шалгах зориулалттай: нүүрэнд харагдах ёсгүй.

**Files:**
- Create: `packages/db-news/prisma/seed-demo.ts`
- Modify: `packages/db-news/package.json` — `"db:seed:demo": "dotenv -e ../../.env -- tsx prisma/seed-demo.ts"`

**Interfaces:**
- Consumes: `packages/db-news/prisma/seed.ts`-ийн үүсгэсэн `parlament` tenant ба 8 ангилал.
- Produces: нийтийн хуудсуудын нүдээр шалгах өгөгдөл. Код руу юу ч export хийхгүй.

- [ ] **Step 1: Implement `seed-demo.ts`**

14 мэдээ: 12 нь `PUBLISHED` (`publishedAt` нь сүүлийн 20 хоногт тараагдсан), 1 нь `DRAFT` (slug `demo-nooreg`), 1 нь `PUBLISHED` боловч `publishedAt` нь +3 хоног (slug `demo-tsag-tovlosson`). Гарчиг, lead нь парламентын бодит сэдвээр монголоор. `motif` нь 7 хэлбэрийг тойрно, `theme` нь 0/1/2-ыг тойрно, 3 нь `featured: true`, 2 нь `story: true`, таг нь `["төсөв","чуулган","хууль"]`-аас сонгоно. `upsert`-ээр `tenantId_slug`-аар — дахин ажиллуулахад давхардахгүй.

**Нууц үг, токен бичихгүй.** Зураг оруулахгүй (`imageUrl: null`) — `cover()`-ийн motif-ийн эргэлт нь ингэж бодит хуудсан дээр шалгагдана.

- [ ] **Step 2: Run it**

Run: `cd packages/db-news && pnpm db:seed:demo`
Expected: `✅ 14 демо мэдээ` гэх мэт дүгнэлт, алдаагүй

- [ ] **Step 3: Verify from the database**

Run:
```bash
docker exec parlamentnews-pg psql -U parlament -d parlamentnews -At -c \
  "select status, count(*) from pn_posts group by status order by status;"
```
Expected: `DRAFT|1` ба `PUBLISHED|13`

- [ ] **Step 4: Run it a second time — давхардахгүй**

Run: `cd packages/db-news && pnpm db:seed:demo` дараа нь дээрх psql
Expected: ижил тоо (13/1), давхардаагүй

- [ ] **Step 5: Commit**

```bash
git add packages/db-news/prisma/seed-demo.ts packages/db-news/package.json
git commit -m "feat(news): demo content seed, including a draft and a scheduled post"
```

---

## Task 5: Дизайний токен ба хуудасны хүрээ (header / footer)

**Files:**
- Modify: `apps/parliament-news/app/globals.css` (бүхэлдээ)
- Modify: `apps/parliament-news/tailwind.config.ts`
- Modify: `apps/parliament-news/app/layout.tsx`
- Create: `apps/parliament-news/components/site-chrome.ts` — `headerModel`, `footerModel` (цэвэр)
- Create: `apps/parliament-news/components/site-chrome.test.ts`
- Create: `apps/parliament-news/components/site-header.tsx` — server component, JSX
- Create: `apps/parliament-news/components/site-footer.tsx` — server component, JSX
- Modify: `apps/parliament-news/vitest.config.ts` — `include`-д `components/**/*.test.ts`
- Modify: `.env.example`, `apps/parliament-news/DEPLOY-CHECKLIST.md` — `NEXT_PUBLIC_SITE_URL`

**Interfaces:**
- Consumes: `getSetting` (`lib/settings.ts`), `menuCategories` (Task 3).
- Produces:
  - `headerModel(setting: SettingOf<"header">, cats: {slug,name}[]): { align: "left"|"center"; logoScale: number; tagline: string; menuMode: "inline"|"below"|"burger"; items: {href: string; label: string}[] }`
  - `footerModel(setting: SettingOf<"footer">): { contact: {label: string; value: string}[]; links: {href: string; label: string}[]; socials: {kind: "fb"|"yt"|"ig"|"x"; href: string}[] }`
  - `<SiteHeader />`, `<SiteFooter />` — server component, өөрсдөө `getSetting` дуудна.

Хоёр модель нь `*.test.ts`-д тестлэгдэх цэвэр функц; JSX нь тэднийг зурна. Ингэснээр React рендерлэх тест шаардахгүй.

- [ ] **Step 1: Write the failing tests** — `components/site-chrome.test.ts`

```ts
describe("headerModel", () => {
  const cats = [{ slug: "chuulgan", name: "Чуулган" }, { slug: "video", name: "Видео" }];

  it("цэсний ангиллыг /c/<slug> болгоно, нүүрийг эхэнд тавина", () => {
    const m = headerModel({ pos: "left", tagline: "", menu: "inline" }, cats);
    expect(m.items).toEqual([
      { href: "/", label: "Нүүр" },
      { href: "/c/chuulgan", label: "Чуулган" },
      { href: "/c/video", label: "Видео" },
    ]);
  });

  it("tagline ба зэрэгцүүлэлтийг дамжуулна", () => {
    const m = headerModel({ pos: "center", tagline: "Парламентын мэдээ", menu: "burger" }, cats);
    expect(m.align).toBe("center");
    expect(m.tagline).toBe("Парламентын мэдээ");
    expect(m.menuMode).toBe("burger");
  });

  it("ангилал байхгүй бол зөвхөн нүүр", () => {
    expect(headerModel({ pos: "left", tagline: "", menu: "inline" }, []).items)
      .toEqual([{ href: "/", label: "Нүүр" }]);
  });
});

describe("footerModel", () => {
  it("зөвхөн бөглөсөн холбоо барих мөрийг гаргана", () => {
    const m = footerModel({
      addr: "Улаанбаатар", phone: "", email: "a@b.mn",
      sales: "", about: "", policy: "", fb: "", yt: "", ig: "", x: "",
    } as never);
    expect(m.contact).toEqual([
      { label: "Хаяг", value: "Улаанбаатар" },
      { label: "И-мэйл", value: "a@b.mn" },
    ]);
  });

  it("хоосон сошиал холбоосыг гаргахгүй", () => {
    const m = footerModel({ fb: "https://facebook.com/x", yt: "", ig: "", x: "" } as never);
    expect(m.socials).toEqual([{ kind: "fb", href: "https://facebook.com/x" }]);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run components/site-chrome.test.ts`
Expected: FAIL — `headerModel is not a function`

`vitest.config.ts`-ийн `include` нь `lib/**` ба `server/**` л авдаг — `components/**/*.test.ts` нэмнэ. Тест файл олдохгүй гэсэн алдаа энэ алхамд гарвал тэр нь хүлээгдсэн: `include`-ийг зас, дараа нь дээрх FAIL-ийг хар.

- [ ] **Step 3: Implement the models and components**

`headerModel`/`footerModel`-ийг `components/site-chrome.ts`-д (цэвэр), `<SiteHeader/>`/`<SiteFooter/>`-ийг `.tsx`-үүдэд.

- [ ] **Step 4: Rewrite `app/globals.css` with the artifact's tokens**

`:root`-д цайвар токенууд; `@media (prefers-color-scheme: dark)` дор `:root:not([data-theme="light"])`; мөн `:root[data-theme="dark"]` — гурван блок (artifact-ийн хэв маяг). `body` нь `background: var(--paper); color: var(--ink)` гэж **тодорхой** авна. Фонтын хувьсагч: `--font-head: "Inter Tight"`, `--font-body: "Noto Serif"`, `--font-title: "PT Serif"`.

- [ ] **Step 5: Wire the fonts and metadata in `layout.tsx`**

`next/font/google`-ээр `Inter_Tight` (500,600,700,800), `Noto_Serif` (400 + italic), `PT_Serif` (700) — `display: "swap"`, `variable` нь дээрх CSS хувьсагчидтай таарна. `metadata` нь `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001")`, `title.template: "%s — Парламентын мэдээ"`, `title.default: "Парламентын мэдээ"`. `<html lang="mn">` хэвээр. `<body>`-д `<SiteHeader/>`, `{children}`, `<SiteFooter/>`.

`NEXT_PUBLIC_SITE_URL`-ийг `.env.example`-д нэмж, `DEPLOY-CHECKLIST.md`-ийн Vercel env жагсаалтад бас нэмнэ.

- [ ] **Step 6: Extend `tailwind.config.ts`**

`colors`-ийг `paper/sheet/ink/muted/cob/red` болгож `var(--…)`-аар; хуучин `brand`/`accent`-ийг **хасна** (artifact-ийн токен нь эх сурвалж; хоёр өнгөний систем зэрэгцэж байх нь хойшид зөрүү үүсгэнэ). `fontFamily`-д `head`/`body`/`title`.

- [ ] **Step 7: Run tests, lint and build**

Run: `cd apps/parliament-news && pnpm test && pnpm lint && pnpm build`
Expected: бүгд PASS. Build-ийн route хүснэгтэд `/` нь `ƒ` (Dynamic) болсон байж болно — header нь DB уншиж байгаа тул хүлээгдсэн.

- [ ] **Step 8: Нүдээр шалгах**

Run: `pnpm exec next dev -p 3005` дараа нь `curl -s localhost:3005/ | head -c 2000`
Expected: HTML-д цэсний ангиллууд (`/c/chuulgan`), footer-ийн хаяг гарч байна. Хөтөч дээр: цайвар/бараан хоёр аль нь ч уншигдана.

- [ ] **Step 9: Commit**

```bash
git add apps/parliament-news/app/globals.css apps/parliament-news/tailwind.config.ts \
        apps/parliament-news/app/layout.tsx apps/parliament-news/components \
        apps/parliament-news/vitest.config.ts .env.example apps/parliament-news/DEPLOY-CHECKLIST.md
git commit -m "feat(news): artifact design tokens, fonts, and settings-driven header/footer"
```

---

## Task 6: Зургийн шугам — WebP/AVIF ба responsive srcset

Хэмжсэн өрсөлдөгчид (дээрх хүснэгт): ikon.mn 296 KB, gogo.mn 335 KB, news.mn
466 KB — гурвуулаа JPEG, `Accept: image/webp` гуйсан ч JPEG, `Vary` header ч
байхгүй. `next/image` нь WebP/AVIF ба `srcset`-ийг автоматаар хийдэг тул энэ
даалгавар нь хамгийн бага кодоор хамгийн том уншигдах зөрүү гаргана.

Нийтлэлийн хуудас (Task 7) ба картууд (Task 8) хоёул зураг зурна, тиймээс
энэ нь тэднээс ӨМНӨ орно — хоёр газар `<img>` бичээд дараа нь солих нь дахин
ажил.

**Files:**
- Modify: `apps/parliament-news/next.config.js` — `images` тохиргоо
- Create: `apps/parliament-news/lib/images.ts`
- Create: `apps/parliament-news/lib/images.test.ts`
- Create: `apps/parliament-news/components/post-image.tsx`
- Create: `apps/parliament-news/public/demo/` — `site-v2/img/flag.jpg`,
  `site-v2/img/palace.jpg`, `site-v2/media/poster.jpg` гурвыг хуулна
- Modify: `packages/db-news/prisma/seed-demo.ts` — 4 мэдээнд зураг оноох

**Interfaces:**
- Consumes: `coverSvg` (Task 2) — зураг үйлчлэх боломжгүй үед эргэх зам.
- Produces:
  ```ts
  export type ImageVariant = "hero" | "card" | "shelf";
  export function imageSizes(variant: ImageVariant): string;
  export function imageDims(variant: ImageVariant): { width: number; height: number };
  /**
   * next/image үйлчилж чадах эх хаяг эсэхийг шалгана. Чадахгүй бол null —
   * тэр үед дуудагч нь эвдэрсэн зураг биш, хавтасны SVG-г зурна.
   */
  export function safeImageSrc(url: string | null | undefined): string | null;
  ```
  `<PostImage variant={ImageVariant} src={string} alt={string} priority?={boolean} />`

- [ ] **Step 1: Write the failing tests** — `lib/images.test.ts`

```ts
describe("imageDims", () => {
  it("hero нь 16:9", () => {
    const d = imageDims("hero");
    expect(d.width / d.height).toBeCloseTo(16 / 9, 2);
  });
  it("card нь 3:2", () => {
    const d = imageDims("card");
    expect(d.width / d.height).toBeCloseTo(3 / 2, 2);
  });
  it("shelf нь хавтасны 474:900", () => {
    expect(imageDims("shelf")).toEqual({ width: 474, height: 900 });
  });
});

describe("imageSizes", () => {
  it("hero нь мобайлд бүтэн, дэлгэцэд хязгаартай", () => {
    expect(imageSizes("hero")).toBe("(max-width: 768px) 100vw, 800px");
  });
  it("card нь мобайлд бүтэн, дэлгэцэд гуравны нэг", () => {
    expect(imageSizes("card")).toBe("(max-width: 768px) 100vw, 33vw");
  });
  it("хувилбар бүр өөр", () => {
    const all = (["hero", "card", "shelf"] as const).map(imageSizes);
    expect(new Set(all).size).toBe(3);
  });
});

describe("safeImageSrc", () => {
  it("дотоод зам нь зөвшөөрөгдөнө", () => {
    expect(safeImageSrc("/demo/palace.jpg")).toBe("/demo/palace.jpg");
  });
  it("зөвшөөрсөн host нь дамжина", () => {
    expect(safeImageSrc("https://abc.public.blob.vercel-storage.com/a.jpg"))
      .toBe("https://abc.public.blob.vercel-storage.com/a.jpg");
  });
  it("зөвшөөрөөгүй host → null (эвдэрсэн зураг биш, хавтас зурагдана)", () => {
    expect(safeImageSrc("https://example.com/a.jpg")).toBeNull();
  });
  it("javascript: ба data: → null", () => {
    expect(safeImageSrc("javascript:alert(1)")).toBeNull();
    expect(safeImageSrc("data:image/svg+xml,<svg onload=alert(1)>")).toBeNull();
  });
  it("хоосон, null, undefined, хэлбэр нь бус мөр → null", () => {
    for (const v of ["", "   ", null, undefined, "://", "http://"]) {
      expect(safeImageSrc(v)).toBeNull();
    }
  });
  it("протоколгүй // хаяг → null", () => {
    expect(safeImageSrc("//evil.com/a.jpg")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/images.test.ts`
Expected: FAIL — `imageDims is not a function`

- [ ] **Step 3: Implement `lib/images.ts`**

`ALLOWED_IMAGE_HOSTS` нь `next.config.js`-ийн `remotePatterns`-тай нэг эх
сурвалжаас гарна: `lib/images.ts`-д массив болгон тодорхойлж, `next.config.js`
түүнийг `require`-ээр уншина — хоёр газар бичвэл зөрж, тест ногоон байхад
production-д зураг 400 буцаана. (`next.config.js` нь CommonJS тул `lib/images.ts`
биш, `lib/image-hosts.js` гэсэн жижиг CJS файлд host-ийн жагсаалтыг тавьж,
`lib/images.ts` ба `next.config.js` хоёул түүнийг уншина.)

v1-ийн зөвшөөрөгдөх host: `*.public.blob.vercel-storage.com` (Vercel Blob,
3-р шатны байршуулалт) ба дотоод зам. Бусад бүх гадаад host татгалзана.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/images.test.ts`
Expected: PASS

- [ ] **Step 5: Configure `next.config.js` and add the demo images**

```js
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: require("./lib/image-hosts.js").REMOTE_PATTERNS,
  minimumCacheTTL: 2592000,
}
```

Демо зургийг хуулна:
```bash
mkdir -p apps/parliament-news/public/demo
cp apps/parliament-news/site-v2/img/flag.jpg apps/parliament-news/public/demo/
cp apps/parliament-news/site-v2/img/palace.jpg apps/parliament-news/public/demo/
cp apps/parliament-news/site-v2/media/poster.jpg apps/parliament-news/public/demo/
```

`seed-demo.ts`-д 4 мэдээнд `NewsMedia` мөр нэмнэ (`url: "/demo/palace.jpg"` гэх
мэт). Үлдсэн 10 нь зураггүй хэвээр — `cover()`-ийн motif-ийн эргэлт бодит
хуудсан дээр шалгагдана.

- [ ] **Step 6: Implement `<PostImage>`**

`next/image`-ийг `safeImageSrc` ба `imageSizes`/`imageDims`-тэй хамт зөөлөн
бүрхүүлнэ. `safeImageSrc` null буцаавал компонент нь `null` буцаана — дуудагч
(Task 7, Task 8) тэр үед `coverSvg`-г зурна. `alt` нь **шаардлагатай** prop;
`caption` байвал түүнийг, байхгүй бол гарчгийг alt болгоно (хоосон alt-тай
мэдээний зураг нь дэлгэц уншигчид мэдээлэлгүй).

`priority` нь зөвхөн нийтлэлийн гол зурагт `true` — бусад бүх зураг lazy
(`next/image`-ийн анхдагч). Жагсаалтын 12 зураг бүгд priority байвал
мобайлын сүлжээг гацуулна.

- [ ] **Step 7: Measure against the competitor numbers — энэ бол хаалга**

Run:
```bash
pnpm exec next dev -p 3005
# WebP-ийн content negotiation
curl -s -o /dev/null -w 'webp гуйсан:  %{content_type}  %{size_download} байт\n' \
  -H 'Accept: image/avif,image/webp,image/*' \
  'http://localhost:3005/_next/image?url=%2Fdemo%2Fpalace.jpg&w=1200&q=75'
# WebP дэмжихгүй хөтөч
curl -s -o /dev/null -w 'webp гуйгаагүй: %{content_type}  %{size_download} байт\n' \
  -H 'Accept: image/*' \
  'http://localhost:3005/_next/image?url=%2Fdemo%2Fpalace.jpg&w=1200&q=75'
# мобайлын өргөн
curl -s -o /dev/null -w 'мобайл 640px:  %{content_type}  %{size_download} байт\n' \
  -H 'Accept: image/avif,image/webp,image/*' \
  'http://localhost:3005/_next/image?url=%2Fdemo%2Fpalace.jpg&w=640&q=75'
```
Expected:
- `webp гуйсан` нь `image/webp` эсвэл `image/avif`, **120000 байтаас бага**
  (ikon.mn-ийн 296 KB, news.mn-ийн 466 KB-тай харьцуул)
- `webp гуйгаагүй` нь `image/jpeg` — хуучин хөтөч эвдрэхгүй
- `мобайл 640px` нь 1200px-ийнхээс мэдэгдэхүйц жижиг

Хэрэв `webp гуйсан` нь JPEG буцаавал `formats` тохиргоо хүчин төгөлдөр
болоогүй — `next dev`-ийг дахин эхлүүл (`next.config.js` нь зөвхөн эхлэхэд
уншигдана).

- [ ] **Step 8: Prove `srcset` reaches the HTML**

`<PostImage variant="card">`-ийг түр нүүрэнд тавьж (эсвэл Task 8-д) :
```bash
curl -s localhost:3005/ | grep -o 'srcset="[^"]\{0,80\}' | head -2
curl -s localhost:3005/ | grep -c 'loading="lazy"'
```
Expected: `srcset` нь хэд хэдэн өргөнтэй (`&w=640`, `&w=750`, …); `loading="lazy"`
нь гол зургаас бусдад.

- [ ] **Step 9: Run the suite, lint and build**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build`
Expected: бүгд PASS

- [ ] **Step 10: Record the measured numbers**

Хэмжсэн гурван тооны үр дүнг `README.md`-ийн шинэ «Хэмжигдэх зорилт» хэсэгт
бич — дараа шатуудад регресс гарвал харьцуулах суурь болно.

- [ ] **Step 11: Commit**

```bash
git add apps/parliament-news/lib/images.ts apps/parliament-news/lib/images.test.ts \
        apps/parliament-news/lib/image-hosts.js apps/parliament-news/next.config.js \
        apps/parliament-news/components/post-image.tsx \
        apps/parliament-news/public/demo packages/db-news/prisma/seed-demo.ts \
        apps/parliament-news/README.md
git commit -m "feat(news): WebP/AVIF image pipeline — 300-470KB JPEG down to under 120KB"
```

---

## Task 7: `/news/<slug>` — нийтлэлийн хуудас, 301, metadata

**Files:**
- Create: `apps/parliament-news/app/news/[slug]/page.tsx`
- Create: `apps/parliament-news/components/article-body.tsx`
- Create: `apps/parliament-news/lib/article.ts`
- Create: `apps/parliament-news/lib/article.test.ts`

**Interfaces:**
- Consumes: `postBySlug`, `postIdByRedirect` (Task 3); `mnDate`, `readMinutes`, `metaDescription` (Task 1); `coverSvg` (Task 2); `<PostImage/>` ба `safeImageSrc` (Task 6).
- Produces:
  - `resolveSlugTarget(requested: string, found: { slug: string } | null): { kind: "render" } | { kind: "redirect"; to: string } | { kind: "notFound" }`
  - `paragraphs(body: string | null): string[]`

- [ ] **Step 1: Write the failing tests** — `lib/article.test.ts`

Review Focus #2-ийн тест:

```ts
describe("resolveSlugTarget", () => {
  it("мэдээ олдоогүй бол 404", () => {
    expect(resolveSlugTarget("baihgui", null)).toEqual({ kind: "notFound" });
  });

  it("гуйсан slug нь одоогийн slug — рендерлэнэ", () => {
    expect(resolveSlugTarget("tosov", { slug: "tosov" })).toEqual({ kind: "render" });
  });

  it("хуучин slug — одоогийн рүү 301", () => {
    expect(resolveSlugTarget("huuchin", { slug: "shine" }))
      .toEqual({ kind: "redirect", to: "/news/shine" });
  });

  it("slug нь хуучин утга руугаа буцсан ч өөр дээрээ redirect хийхгүй", () => {
    // A -> B -> A: "a" гэсэн redirect мөр үлдсэн, мэдээний slug нь дахиад "a"
    expect(resolveSlugTarget("a", { slug: "a" })).toEqual({ kind: "render" });
  });
});

describe("paragraphs", () => {
  it("хоосон мөрөөр хуваана", () => {
    expect(paragraphs("Нэг\n\nХоёр")).toEqual(["Нэг", "Хоёр"]);
  });
  it("нэг хоосон мөр ч, хэд ч байсан адил", () => {
    expect(paragraphs("Нэг\n\n\n\nХоёр")).toEqual(["Нэг", "Хоёр"]);
  });
  it("зөвхөн зайтай хэсгийг гаргахгүй", () => {
    expect(paragraphs("Нэг\n\n   \n\nХоёр")).toEqual(["Нэг", "Хоёр"]);
  });
  it("null → хоосон массив", () => {
    expect(paragraphs(null)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/article.test.ts`
Expected: FAIL — `resolveSlugTarget is not a function`

- [ ] **Step 3: Implement `lib/article.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/article.test.ts`
Expected: PASS

- [ ] **Step 5: Implement the page**

`app/news/[slug]/page.tsx`:
- `export const revalidate = 300`
- `generateMetadata({ params })` → `postBySlug` → `title`, `description: metaDescription(...)`, `openGraph: { type: "article", publishedTime, url: canonical }`, `alternates.canonical`. Мэдээ байхгүй бол `title: "Мэдээ олдсонгүй"`.
- Page: `postBySlug(slug)`; null бол `postIdByRedirect(slug)`; `resolveSlugTarget` → `render` | `redirect(to, "permanent")` (`next/navigation`-ийн `permanentRedirect`) | `notFound()`.
- Биет: kicker, `<h1>`, lead, `mnDate(date)`, reporter, `readMinutes`, ангиллын холбоос, тагууд `/tag/<tag>`, `media[0]` байвал зураг, байхгүй бол `coverSvg` inline, `sources` жагсаалт, `article-body.tsx` нь `paragraphs()`-ээр `<p>`-үүд.
- `<article>` дотор JSON-LD `NewsArticle` `<script type="application/ld+json">`.

`paragraphs()`-ийн гаргалт нь **текст**, `dangerouslySetInnerHTML` ХЭРЭГЛЭХГҮЙ — `body` нь редакцаас ирэх учир 3-р шатад HTML болох магадлалтай, тэр үед sanitize хийх шийдвэрийг тусад нь гаргана. Үүнийг кодын тайлбарт бич.

- [ ] **Step 6: Verify against the running app**

Run:
```bash
pnpm exec next dev -p 3005
curl -s -o /dev/null -w '%{http_code}\n' localhost:3005/news/demo-nooreg          # ноорог
curl -s -o /dev/null -w '%{http_code}\n' localhost:3005/news/demo-tsag-tovlosson   # цаг товлосон
curl -s -o /dev/null -w '%{http_code}\n' localhost:3005/news/baihgui-medee
curl -s localhost:3005/news/<демо нийтлэгдсэн slug> | grep -c '<h1'
```
Expected: ноорог `404`, цаг товлосон `404`, байхгүй `404`, нийтлэгдсэн нь `<h1` нэг удаа. **Энэ бол Review Focus #1-ийн бодит баталгаа.**

- [ ] **Step 7: Verify the 301 by hand**

`psql`-ээр нэг нийтлэгдсэн мэдээнд `pn_slug_redirects` мөр нэмж (`fromSlug='hoonii-hayag'`), дараа нь:
```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' localhost:3005/news/hoonii-hayag
```
Expected: `308` эсвэл `301` ба одоогийн slug руу. (Next-ийн `permanentRedirect` нь 308 буцаана — энэ нь 301-тэй адил «бүрмөсөн», метод хадгалдаг. Хэрэв SEO-д яг 301 шаардвал `next.config.js`-ийн `redirects()` биш, route handler хэрэгтэй — тэр үед шийдвэрийг ledger-т бич.)

- [ ] **Step 8: Run the suite and build**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build`
Expected: бүгд PASS

- [ ] **Step 9: Commit**

```bash
git add apps/parliament-news/lib/article.ts apps/parliament-news/lib/article.test.ts \
        apps/parliament-news/app/news apps/parliament-news/components/article-body.tsx
git commit -m "feat(news): article page with permanent slug redirects and metadata"
```

---

## Task 8: Нүүр — SSR жагсаалт + 3D номын тавиур

**Files:**
- Modify: `apps/parliament-news/app/page.tsx`
- Create: `apps/parliament-news/components/post-card.tsx`
- Create: `apps/parliament-news/components/shelf-model.ts`
- Create: `apps/parliament-news/components/shelf-model.test.ts`
- Create: `apps/parliament-news/components/shelf.tsx` (`"use client"`)
- Create: `apps/parliament-news/components/shelf.module.css`

**Interfaces:**
- Consumes: `listPosts` (Task 3), `coverSvg` (Task 2), `mnShortDate` (Task 1), `<PostImage/>` (Task 6).
- Produces:
  - `type ShelfBook = { href: string; spineLabel: string; kicker: string; number: string; date: string; coverSvg: string; lead: string; bg: string; fg: string; light: boolean }`
  - `shelfBooks(posts: PostListItem[], opts?: { startNumber?: number }): ShelfBook[]`
  - `<Shelf books={...} />`

- [ ] **Step 1: Write the failing tests** — `components/shelf-model.test.ts`

```ts
const post = (over: Partial<PostListItem> = {}) => ({
  slug: "tosov", title: "Төсөв батлагдлаа", kicker: "ЧУУЛГАН", lead: "Товч",
  date: new Date("2026-11-26T00:00:00Z"), categoryName: "Төсөв",
  motif: "bars", theme: 0, look: null, imageUrl: null, featured: false, ...over,
}) as PostListItem;

describe("shelfBooks", () => {
  it("мэдээ бүрт /news/<slug> холбоос", () => {
    expect(shelfBooks([post()])[0].href).toBe("/news/tosov");
  });

  it("нурууны дугаар artifact-ийн 141-ээс эхэлнэ", () => {
    const books = shelfBooks([post({ slug: "a" }), post({ slug: "b" })]);
    expect(books.map((b) => b.number)).toEqual(["№ 141", "№ 142"]);
  });

  it("нурууны огноо нь сар.өдөр", () => {
    expect(shelfBooks([post()])[0].date).toBe("11.26");
  });

  it("нурууны шошго нь ангиллын нэр", () => {
    expect(shelfBooks([post()])[0].spineLabel).toBe("Төсөв");
  });

  it("өнгө нь палитраас, light нь дэвсгэрээс", () => {
    const b = shelfBooks([post({ theme: 0 })])[0];
    expect(b.bg).toBe("#0A22E0");
    expect(b.fg).toBe("#F3F0EA");
    expect(b.light).toBe(false);
  });

  it("хавтасны SVG нь бүтэн", () => {
    expect(shelfBooks([post()])[0].coverSvg).toContain('viewBox="0 0 474 900"');
  });

  it("мэдээ байхгүй бол хоосон массив — тавиур хоосон зурна", () => {
    expect(shelfBooks([])).toEqual([]);
  });

  it("kicker байхгүй бол гарчгаар эргэнэ", () => {
    expect(shelfBooks([post({ kicker: null })])[0].kicker).toBe("Төсөв батлагдлаа");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run components/shelf-model.test.ts`
Expected: FAIL — `shelfBooks is not a function`

- [ ] **Step 3: Implement `shelf-model.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run components/shelf-model.test.ts`
Expected: PASS

- [ ] **Step 5: Port the 3D CSS into `shelf.module.css`**

Эх сурвалж: `site-v2/index.html`-ийн `.shelf`, `.stage`, `.tape`, `.f`, `.sp`, `.cv`, `.bk`, `.bkt`, `.fe`, `.plate`, `.mk` дүрмүүд. Хадгалах тогтмолууд: `perspective: 1400px`, `transform-style: preserve-3d`, `.bk { border-radius: 4px 2px 2px 4px }`, `.bkt { inset: 12% 12% 10% 14% }`, `--ease: cubic-bezier(.2,.8,.2,1)`.

**Artifact-аас зориуд ЗӨРӨХ зүйлс** (кодын тайлбарт шалтгааныг бич):
- `.shelf` нь `position: fixed` байхаа болино → `position: relative`. Artifact нь нэг хуудасны SPA байсан; энд тавиур нь нүүрний нэг хэсэг, доороо жагсаалт, footer байна.
- `--cy` (дэлгэцийн босоо төв) хамаарал хасагдана.
- `@media (prefers-reduced-motion: reduce)` дор бүх `transform`/`transition` унтарч, тавиур нь хэвтээ гүйдэг хавтасны жагсаалт болно.

CSS нь **200 мөрөөс дотогш**. Хэтэрвэл зөвхөн нурууны 3D-г үлдээж, нээгдэх анимацийг хасна — энэ шийдвэрийг ledger-т бич.

- [ ] **Step 6: Implement `shelf.tsx` (client)**

`"use client"`. Props: `books: ShelfBook[]`. `useState` нь сонгосон индекс, `useRef` нь stage. Хуруу/хулганы хэвтээ чирэлт (`pointerdown/move/up`) ба `wheel` нь индексийг хөдөлгөнө; `transform: translateZ/rotateY`-г индексээс тооцно. Клавиатур: `←`/`→` нь индекс, `Enter` нь холбоос. `role="list"`, элемент бүр `role="listitem"`, хавтас нь `<a href={book.href}>` — **анимаци унасан ч холбоос ажиллана**.

`useEffect`-гүйгээр SSR-д тавиур зурагдахгүй байхыг БИЧИХГҮЙ: `books` нь props-оор ирэх тул эхний рендер нь мөн л HTML гаргана.

- [ ] **Step 7: Implement `app/page.tsx`**

```
export const revalidate = 300;
```
`listPosts({ take: 12 })` → `<Shelf books={shelfBooks(posts)} />` дараа нь `<section>` дотор `posts.map(p => <PostCard …/>)` — `<article>` + `<h2><a href={`/news/${p.slug}`}>`. Тавиур нь дүрслэл, жагсаалт нь агуулга: **жагсаалтыг `display:none`-оор нуухгүй**, доор нь «Бүх мэдээ» хэсэг болж харагдана (SEO ба JS-гүй хөтөч).

`listPosts({ featured: true, take: 3 })`-аар нүүр мэдээний блок.

- [ ] **Step 8: Prove the SSR content exists without JS**

Run:
```bash
pnpm exec next dev -p 3005
curl -s localhost:3005/ | grep -o 'href="/news/[a-z0-9-]*"' | sort -u | wc -l
curl -s localhost:3005/ | grep -c 'demo-nooreg'
```
Expected: 12-оос доошгүй өөр мэдээний холбоос; `demo-nooreg` нь **0 удаа** (ноорог нүүрэнд байхгүй).

- [ ] **Step 9: Нүдээр шалгах**

Хөтөч дээр `localhost:3005` — тавиур нь 3D-гээр зурагдаж, чирэхэд хөдөлж, хавтас дарахад мэдээ нээгдэнэ. Бараан/цайвар хоёуланд. Утасны өргөнд (375px) хэвтээ гүйлт ажиллаж, хуудас хэвтээ чиглэлд халихгүй.

- [ ] **Step 10: Run the suite and build**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build`
Expected: бүгд PASS

- [ ] **Step 11: Commit**

```bash
git add apps/parliament-news/app/page.tsx apps/parliament-news/components
git commit -m "feat(news): home page — SSR article list with the 3D shelf hydrating over it"
```

---

## Task 9: Ангилал, таг, хайлт

**Files:**
- Create: `apps/parliament-news/app/c/[slug]/page.tsx`
- Create: `apps/parliament-news/app/tag/[tag]/page.tsx`
- Create: `apps/parliament-news/app/search/page.tsx`
- Create: `apps/parliament-news/components/pager.tsx`
- Create: `apps/parliament-news/lib/paging.ts`
- Create: `apps/parliament-news/lib/paging.test.ts`

**Interfaces:**
- Consumes: `postsByCategory`, `postsByTag`, `searchPosts`, `countPosts`, `searchTerm` (Task 3); `<PostCard/>` (Task 8).
- Produces: `pageParams(raw: string | string[] | undefined, perPage: number, total: number): { page: number; skip: number; take: number; pages: number }`

- [ ] **Step 1: Write the failing tests** — `lib/paging.test.ts`

Review Focus #3-ийн хуудаслалтын хэсэг:

```ts
describe("pageParams", () => {
  it("анхдагч нь 1-р хуудас", () => {
    expect(pageParams(undefined, 12, 100)).toEqual({ page: 1, skip: 0, take: 12, pages: 9 });
  });
  it("2-р хуудас", () => {
    expect(pageParams("2", 12, 100)).toMatchObject({ page: 2, skip: 12 });
  });
  it("хүрээнээс хэтэрсэн хуудас → эцсийн хуудас", () => {
    expect(pageParams("999", 12, 100)).toMatchObject({ page: 9, skip: 96 });
  });
  it("тоо биш, 0, сөрөг → 1-р хуудас", () => {
    for (const v of ["abc", "0", "-3", "1.5", ""]) {
      expect(pageParams(v, 12, 100)).toMatchObject({ page: 1, skip: 0 });
    }
  });
  it("мэдээ байхгүй бол хуудас 1, pages 1", () => {
    expect(pageParams("3", 12, 0)).toEqual({ page: 1, skip: 0, take: 12, pages: 1 });
  });
  it("массив параметрийн эхнийхийг авна", () => {
    expect(pageParams(["2", "5"], 12, 100)).toMatchObject({ page: 2 });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/paging.test.ts`
Expected: FAIL — `pageParams is not a function`

- [ ] **Step 3: Implement `lib/paging.ts` and `<Pager/>`**

- [ ] **Step 4: Run to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/paging.test.ts`
Expected: PASS

- [ ] **Step 5: Implement the three pages**

Гурвуулаа `export const revalidate = 300`, `generateMetadata`, `<PostCard/>`-ийн жагсаалт, `<Pager/>`.

- `/c/[slug]` — ангилал байхгүй бол `notFound()`. Гарчиг нь ангиллын нэр.
- `/tag/[tag]` — `decodeURIComponent(params.tag)`. Таг нь кирилл байж болно. Мэдээ байхгүй бол 404 биш, «Энэ тагаар мэдээ алга» гэсэн хоосон төлөв (таг нь чөлөөт текст, байхгүй нь алдаа биш).
- `/search` — `searchParams.q`. `searchTerm(q)` null бол хайлт хийхгүй, хайх форм ба заавар харуулна. Хайсан бол «"<q>" — N мэдээ».

`/search` нь `export const dynamic = "force-dynamic"`: `q` нь хязгааргүй хувилбартай тул кэшлэхгүй.

- [ ] **Step 6: Verify against the running app**

Run:
```bash
curl -s -o /dev/null -w 'c/chuulgan      %{http_code}\n' localhost:3005/c/chuulgan
curl -s -o /dev/null -w 'c/baihgui       %{http_code}\n' localhost:3005/c/baihgui
curl -s -o /dev/null -w 'tag кирилл      %{http_code}\n' "localhost:3005/tag/%D1%82%D3%A9%D1%81%D1%91%D0%B2"
curl -s -o /dev/null -w 'tag байхгүй     %{http_code}\n' localhost:3005/tag/baihgui
curl -s -o /dev/null -w 'search хоосон   %{http_code}\n' "localhost:3005/search?q="
curl -s -o /dev/null -w 'search зай      %{http_code}\n' "localhost:3005/search?q=%20%20"
curl -s -o /dev/null -w 'search кирилл   %{http_code}\n' "localhost:3005/search?q=%D1%82%D3%A9%D1%81%D1%91%D0%B2"
curl -s -o /dev/null -w 'search урт      %{http_code}\n' "localhost:3005/search?q=$(python -c 'print("a"*300)')"
curl -s -o /dev/null -w 'page 999        %{http_code}\n' "localhost:3005/c/chuulgan?page=999"
curl -s -o /dev/null -w 'page abc        %{http_code}\n' "localhost:3005/c/chuulgan?page=abc"
```
Expected: `c/baihgui` нь 404; бусад бүгд **200**. Хоосон хайлт нь бүх мэдээг жагсаахгүй (`curl … | grep -c 'href="/news/'` → 0).

- [ ] **Step 7: Run the suite and build**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build`
Expected: бүгд PASS

- [ ] **Step 8: Commit**

```bash
git add apps/parliament-news/app/c apps/parliament-news/app/tag apps/parliament-news/app/search \
        apps/parliament-news/components/pager.tsx apps/parliament-news/lib/paging.ts \
        apps/parliament-news/lib/paging.test.ts
git commit -m "feat(news): category, tag and search pages with safe paging"
```

---

## Task 10: sitemap, RSS, robots, Open Graph зураг

**Files:**
- Create: `apps/parliament-news/app/sitemap.ts`
- Create: `apps/parliament-news/app/robots.ts`
- Create: `apps/parliament-news/app/rss.xml/route.ts`
- Create: `apps/parliament-news/app/news/[slug]/opengraph-image.tsx`
- Create: `apps/parliament-news/lib/feed.ts`
- Create: `apps/parliament-news/lib/feed.test.ts`

**Interfaces:**
- Consumes: `allPublishedForFeed`, `menuCategories` (Task 3); `xmlEscape`, `absoluteUrl` (Task 1); `coverSvg` (Task 2); `getSetting("feed")` (`lib/settings.ts`).
- Produces: `rssXml(input: { site: string; title: string; items: {slug,title,lead,publishedAt}[] }): string`

- [ ] **Step 1: Write the failing tests** — `lib/feed.test.ts`

Review Focus #4-ийн тест:

```ts
const items = [{
  slug: "tosov", title: 'АН & МАН "хоёр" <b>', lead: "Товч & тайлбар",
  publishedAt: new Date("2026-11-26T10:00:00Z"),
}];

describe("rssXml", () => {
  const xml = rssXml({ site: "https://parlamentnews.mn", title: "Парламентын мэдээ", items });

  it("RSS 2.0 бүрхүүл", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
  });

  it("гарчгийн &, <, \" -г escape хийнэ — XML хугарахгүй", () => {
    expect(xml).toContain("АН &amp; МАН &quot;хоёр&quot; &lt;b&gt;");
    expect(xml).not.toContain("<b>");
  });

  it("& нь давхар escape болохгүй", () => {
    expect(xml).not.toContain("&amp;amp;");
  });

  it("link нь бүтэн хаяг", () => {
    expect(xml).toContain("<link>https://parlamentnews.mn/news/tosov</link>");
  });

  it("pubDate нь RFC 822", () => {
    expect(xml).toContain("<pubDate>Thu, 26 Nov 2026 10:00:00 GMT</pubDate>");
  });

  it("мэдээ байхгүй бол ч хүчинтэй XML", () => {
    const empty = rssXml({ site: "https://x.mn", title: "T", items: [] });
    expect(empty).toContain("<channel>");
    expect(empty).not.toContain("<item>");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/feed.test.ts`
Expected: FAIL — `rssXml is not a function`

- [ ] **Step 3: Implement `lib/feed.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/feed.test.ts`
Expected: PASS

- [ ] **Step 5: Implement the routes**

- `app/sitemap.ts` — `MetadataRoute.Sitemap`: `/`, ангилал бүр, `allPublishedForFeed(5000)`-ийн мэдээ бүр `lastModified: updatedAt`. Цаг товлосон мэдээ орохгүй (хаалга нь Task 3).
- `app/robots.ts` — `MetadataRoute.Robots`: `allow: "/"`, `disallow: ["/studio", "/api"]`, `sitemap`.
- `app/rss.xml/route.ts` — `getSetting("feed")`-ийн `rss` нь `false` бол **404**; эс бөгөөс `rssXml(...)` нь `Content-Type: application/rss+xml; charset=utf-8`. `export const revalidate = 300`.
- `app/news/[slug]/opengraph-image.tsx` — `size = { width: 1200, height: 630 }`. `ImageResponse`-д `coverSvg`-ийн SVG-г `data:image/svg+xml;base64,...` болгож `<img>`-ээр биш — `next/og` нь гадаад SVG-г дүрсэлдэггүй. Оронд нь: зүүн талд `coverSvg`-ийн палитрын `bg`, дээр нь гарчиг (`Inter Tight` 800), доор нь ангилал ба огноо; баруун талд `media[0]` байвал зураг, байхгүй бол палитрын хоёр өнгийн геометр. **Review Focus #5:** зурагтай ба зураггүй хоёр тохиолдлыг хоёуланг нь шалгана.

`ImageResponse`-д фонт нь `fetch`-ээр уншигддаг — `Inter Tight`-ийн `.ttf`-ийг `public/fonts/`-д тавьж `fs`-ээр уншина (гадаад сүлжээний хамаарал build-д орохгүй).

- [ ] **Step 6: Verify the outputs**

Run:
```bash
curl -s localhost:3005/sitemap.xml | head -c 400
curl -s localhost:3005/robots.txt
curl -s localhost:3005/rss.xml | head -c 400
curl -s localhost:3005/sitemap.xml | grep -c 'demo-nooreg'
curl -s localhost:3005/sitemap.xml | grep -c 'demo-tsag-tovlosson'
curl -s -o /dev/null -w 'OG зураггүй %{http_code} %{content_type}\n' \
  'localhost:3005/news/<зураггүй демо slug>/opengraph-image'
```
Expected: sitemap ба rss нь хүчинтэй XML; `demo-nooreg` **0**, `demo-tsag-tovlosson` **0**; OG нь `200` ба `image/png`.

- [ ] **Step 7: Validate the XML with a parser, not by eye**

Run:
```bash
curl -s localhost:3005/rss.xml > /tmp/rss.xml
curl -s localhost:3005/sitemap.xml > /tmp/sitemap.xml
python -c "import xml.dom.minidom as m; m.parse('/tmp/rss.xml'); m.parse('/tmp/sitemap.xml'); print('XML OK')"
```
Expected: `XML OK` — escape алдаа байвал энд л баригдана.

- [ ] **Step 8: Run the suite and build**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build && cd ../web && pnpm build`
Expected: бүгд PASS — **nuul.mn-ийн build мөн ногоон**

- [ ] **Step 9: Update the docs**

`DEPLOY-CHECKLIST.md`-ийн «5. Нээлтийн өмнө»-д `robots.txt`, `sitemap.xml`, `rss.xml` ба OG-ийн мөрүүдийг «(2-р шат)»-аас гаргаж, шалгах командыг нэмнэ. `README.md`-ийн «Хөгжүүлэлт эхлүүлэх»-д `db:seed:demo` ба нийтийн замуудын жагсаалтыг нэмнэ.

- [ ] **Step 10: Commit**

```bash
git add apps/parliament-news/app/sitemap.ts apps/parliament-news/app/robots.ts \
        apps/parliament-news/app/rss.xml apps/parliament-news/app/news/\[slug\]/opengraph-image.tsx \
        apps/parliament-news/lib/feed.ts apps/parliament-news/lib/feed.test.ts \
        apps/parliament-news/public/fonts apps/parliament-news/DEPLOY-CHECKLIST.md \
        apps/parliament-news/README.md
git commit -m "feat(news): sitemap, RSS, robots and per-article Open Graph images"
```

---

## Дууссаны дараа

Бүх даалгавар дууссаны дараа **нэг бүтэн branch-ийн хяналт** (`superpowers:requesting-code-review`, хамгийн чадварлаг модель, шинэ контекст). Review Focus-ийн 5 мөрийг хянагчид үг дуудлагаар дамжуулна — тестүүд тэднийг хөндсөн ч, хянагч тус бүрийг зориуд шалгана.

Дараа нь `superpowers:finishing-a-development-branch`.

**3-р шатад үлдэх зүйлс** (энэ шатанд зориуд оруулаагүй, дизайн бичгийн §6-ийн дараалалд):
- `/live`, `/video`, `/bill/<id>`, `/story/<id>` — 4-р шатны модулиуд
- Сэтгэгдэл харуулах (`NewsComment` схемд байна, UI нь 3-р шат)
- Шуурхай мэдээний гүйдэг мөр, ханш, цаг агаар — `TickerAd`/`FxRate`/`weather` тохиргоо нь 4-р шат
- Баннер, сурталчилгааны байр (`Banner`, `AdRate`) — 4-р шат
- Логоны SVG symbol (Task 2-ийн кодын тайлбарт тэмдэглэсэн)
- `body`-г HTML болгох эсэх ба sanitize (Task 7-ийн кодын тайлбарт тэмдэглэсэн)
