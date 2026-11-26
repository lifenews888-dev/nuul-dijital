# Parliament News — өргөтгөх боломжтой платформ (дизайн бичиг)

Огноо: 2026-11-25 · Нээлт: 2027-01-01 · Байршил: `apps/parliament-news`

Хэнд: Нүүл Дижиталын шийдвэр гаргагч ба энэ төслийг хөгжүүлэх инженер.

## 1. Зорилго ба яагаад

`site-v2/` дэх Claude artifact загварыг (index.html 187KB + admin.html 220KB) бодит,
өргөтгөх боломжтой вэб платформ болгох. Эхний tenant нь `parlamentnews.mn`
домэйн дээрх УИХ-ын мэдээний сайт ба редакцын систем. Захиалагч байгууллага
хараахан тодорхойгүй — платформыг Нүүл Дижитал өөрөө эхлүүлж, хожим
мэдээллийн байгууллагад шилжүүлэх эсвэл үйлчилгээ болгон зарах боломжтой.

Яагаад одоо: 2027-01-01-нд нээх ёстой. Яагаад платформ: Nuul.mn бол SaaS багц —
«мэдээний сайт + CMS + эрх + баннерын бүртгэл» гэсэн бүтээгдэхүүнийг дараа нь
аймгийн хэвлэл, яам, байгууллагын мэдээний сайтуудад зарах боломжтой.

Амжилтын шалгуур:
- Редакцын багийн гишүүд 2027-01-01-нд өөрсдөө мэдээ нийтэлж байх
- Мэдээ бүр өөрийн URL-тэй, Facebook-т хуваалцахад зураг, гарчиг зөв гарах
- Хоёр дахь байгууллагыг нэмэхэд код бичихгүйгээр, зөвхөн tenant үүсгэхэд болох

## 2. Goals / Non-goals / Anti-goals

**Goals**
- Multi-tenant **бэлэн** өгөгдлийн сан: контентын хүснэгт бүрт `tenantId`, бүх query автоматаар шүүгдэх
- Нийтийн сайт: SSR, `/news/<slug>`, sitemap, RSS, Open Graph — SEO бүрэн
- Редакцын систем: 10 эрх, `draft → review → approved → published` урсгал, тайлбартай буцаалт
- `site-v2`-ийн дизайн, модулиудыг (номын тавиур, хуулийн төслийн 5 шат, ирц, стори, баннер) хадгалах
- `@nuul/db`, `@nuul/ui`-г дахин ашиглах — шинэ дэд бүтэц үүсгэхгүй

**Non-goals (v1-д биш)**
- Сошиал руу автоматаар нийтлэх (Meta/YouTube/TikTok API) — 2-р шат, UI-д байр нь үлдэнэ
- AI засвар, дуугаар бичих — 2-р шат (`claude.use('sample'/'dictation')`-ийн орлуулга)
- Өөрийн сервер дээр видео хадгалах — YouTube embed
- Tenant өөрөө бүртгүүлэх self-serve онбординг — tenant-ыг гараар үүсгэнэ
- **Олон байгууллагыг зэрэг үйлчлэх** — одоо нэг сайт (`parlament`). Схем, шүүлт,
  composite FK бэлэн байгаа тул хоёр дахь сайт нэмэх нь нэг файлын өөрчлөлт
  (`lib/tenant.ts` host-аар хайдаг болох), гэхдээ домэйноор таних нь v1-д байхгүй

**Anti-goals (техникийн хувьд ажиллаад ч бүтэлгүйтэл гэж үзэх)**
- `apps/web` (nuul.mn, 53 хуудас) эвдрэх, build хугарах
- Artifact-ийн JS-ийг хуулж зөөх → засах боломжгүй 400KB файл дахин үүсэх
- Нэг хуудасны SPA болж, мэдээ тус бүрийн URL байхгүй болох
- Tenant-уудын өгөгдөл хоорондоо харагдах (query-д `tenantId` мартагдах)

## 3. Хязгаарлалт

- Монорепо: pnpm + turbo, Next.js 14 App Router, Prisma 5, NextAuth 4, Postgres, Vercel
- Root `vercel.json` одоо зөвхөн `apps/web`-ийг build хийдэг → хоёр дахь Vercel project хэрэгтэй
- Хэрэглэгчийн интерфэйс бүхэлдээ монгол хэл, кирилл гарчгаас латин slug хөрвүүлэх шаардлагатай
- Нээлт хүртэл ~5 долоо хоног

## 4. Авч үзсэн хувилбарууд

| | Хувилбар | Үнэлгээ |
|---|---|---|
| A | Шинэ апп `apps/parliament-news`, нэг Postgres, `packages/db`-г хуваалцана | 1-р шатыг ингэж эхлүүлсэн, дараа нь C болгов |
| B | `apps/web` дотор route group болгож, hostname-аар rewrite | nuul.mn-ийн 53 хуудас, dashboard-тай нэг codebase болж зангирна. Нэг деплой — мэдээний сайтын асуудал SaaS-ийг унагана |
| C | **Шинэ апп + тусдаа өгөгдлийн сан (`packages/db-news`)** | ✅ Сонгосон (2026-11-25, 1-р шатны хяналтын дараа) |

**C-г сонгосон шалтгаан:** мэдээний контент nuul.mn-ийн захиалга, төлбөрийн
өгөгдөлтэй нэг санд байрлахгүй — нэг талын схемийн алдаа нөгөөд хүрэхгүй, өгөгдлийг
хожим өөр байгууллагад шилжүүлэхэд сан бүхэлдээ хөдөлнө. nuul.mn-ийн ажиллаж буй
санд 17 шинэ хүснэгт `db push`-оор нэмэх эрсдэл ч арилна.

**C-ийн төлбөр (зориудаар хүлээсэн):** редакцын хэрэглэгч мэдээний сангийн өөрийн
`pn_users` хүснэгтэд байрлана, nuul.mn-тэй нэг нэвтрэлт байхгүй. Энэ нь хуваалцсан
`User`-тэй холбоотой эрхийн алдааны бүтэн нэг төрлийг (редакторт санамсаргүйгээр
nuul.mn-ийн админ эрх өгөх) бүрмөсөн хаасан.

## 5. Архитектур

### 5.1 Апп

```
apps/parliament-news/              @nuul/news — Next.js 14 App Router
  app/(site)/                      нийтийн сайт (SSR + ISR)
  app/(studio)/studio/             редакцын систем, нэвтрэлтийн цаана
  app/api/                         trpc, revalidate, rss
  middleware.ts                    зөвхөн /studio-ийн нэвтрэлтийн хаалга
  lib/routes.ts                    /studio-ийн замын дүрэм
  lib/tenant.ts                    tenant resolve + cache
  lib/permissions.ts               10 эрхийн модуль (серверт шалгана)
  server/routers/                  news, category, settings, media, team, comment, bill, agenda
packages/db-news/                  @nuul/db-news — мэдээний ТУСДАА Postgres
  prisma/schema.prisma             pn_* моделиуд + редакцын User (pn_users)
  prisma/seed.ts                   parlament tenant, ангилал, тохиргоо, супер админ
  generated/client/                Prisma client (git-д ордоггүй)
  src/index.ts                     prisma singleton
packages/db/prisma/schema.prisma   nuul.mn-ийнх — ХӨНДӨГДӨХГҮЙ
```

`site-v2/`, `prototype/` хэвээр үлдэж, дизайн ба өгөгдлийн бүтцийн эх сурвалж болно.

### 5.2 Tenant таних

`Tenant { id, slug, name, domains[], brand, settings }`. Одоо **нэг сайт** тул
домэйноор хайхгүй: `lib/tenant.ts` нь `NEWS_TENANT_SLUG` (default `parlament`)
гэсэн нэг tenant-ыг `unstable_cache`-тай уншина. `headers()` дуудахгүй учраас
нийтийн хуудас статикаар кэшлэгдэж, нийтлэхэд `revalidateTag("pn-tenant")`-аар
шинэчлэгдэнэ.

tRPC context нь `forTenant(tenant.id)`-ээр хаалттай `db`-г өгнө — router-ууд
`ctx.db`-гүй контентын query бичихгүй.

Хоёр дахь сайт нэмэх шаардлага гарвал: `lib/tenant.ts`-ийг host-аар хайдаг
болгоно (`Tenant.domains` аль хэдийн схемд байна). Тэр үед хуудасны кэш
Host-оор салахгүй гэдгийг анхаарч, tenant-ыг замын параметр болгоно
(`/_t/<slug>/...` rewrite) — өгөгдлийн сан, шүүлт нь дахин бүтээх шаардлагагүй.

### 5.3 Өгөгдлийн сан (тусдаа Postgres, `pn_` хүснэгтийн нэртэй)

Холболт: `NEWS_DATABASE_URL` / `NEWS_DIRECT_URL` (nuul.mn-ийн `DATABASE_URL`-аас
өөр Supabase project). Редакцын хэрэглэгч `User` → `pn_users` нь энэ санд байрлана;
платформын `UserRole` энд байхгүй, эрх зөвхөн `TenantMember`-ээс.

Хүүхэд холбоос бүр `[tenantId, id]` рүү composite foreign key-ээр холбогдоно
(`NewsMedia`, `NewsComment`, `NewsSlugRedirect`, `BillStage`, мөн сонголттой
`NewsPost.category`, `NewsCategory.parent`, `Bill.post`) — өөр tenant-ийн мэдээнд
хавсаргах боломжийг өгөгдлийн сан өөрөө хориглоно.

| Модель | Тайлбар |
|---|---|
| `Tenant` | байгууллага: домэйн, брэнд (лого, өнгө), тохиргоо |
| `TenantMember` | `userId` + `tenantId` + **редакцын эрх** (10 эрх). nuul.mn-ийн `UserRole` хөндөгдөхгүй |
| `NewsPost` | artifact-ийн `news` doc: `title, lead, body, kicker, date, category, subcategory, reporter, source, motif, look, theme, featured, story, storyUntil, tags[], status, scheduledAt, slug` |
| `NewsMedia` | зураг/видео + `caption`, дараалал (artifact-ийн `imgs[]`/`caps[]`) |
| `NewsCategory` | tenant бүрийн ангилал, дараалал |
| `Bill` + `BillStage` | хуулийн төслийн 5 шат, санал хураалт (`s, y, n, steps[{d,x,att}]`) |
| `Agenda` | өнөөдрийн хуралдааны хуваарь |
| `LiveState` | ирц (0–126), хуралдааны төлөв, ШУУД/ЯАРАЛТАЙ мөр |
| `Banner`, `TickerAd` | баннер ба гүйдэг мөрийн зар |
| `Comment` | уншигчийн сэтгэгдэл (artifact-ийн `cm/<uid>` → хэвийн хүснэгт) |
| `ActivityLog` | `create/save/submit/approve/return/publish/unpublish/status` |
| `TenantSetting` | `site/settings` doc → tenant бүрийн key-value |

Дүрэм: контентын модель бүрт `tenantId`, `@@index([tenantId, ...])`, slug-д
`@@unique([tenantId, slug])`.

### 5.4 Эрх (artifact-аас хэвээр)

`super, chief, reviewer, reporter, media, legal, social, live, contributor, analyst`
— 10 эрх, тэдгээрийн засах хэсгүүд (`SECS`) ба үйлдлийн зөвшөөрөл (`canDel`, `canNew`)
нь `site-v2/admin.html:844-886`-д тодорхойлогдсон. Үүнийг серверийн зөвшөөрлийн
модуль болгон хөрвүүлнэ — UI-д нуух нь хамгаалалт биш, tRPC procedure бүр шалгана.

### 5.5 Claude artifact үйлчилгээний орлуулга

| Artifact | Орлуулга |
|---|---|
| `claude.use('db')` + `onSnapshot` | Prisma + tRPC. Бодит цагийн шинэчлэлт: `revalidateTag` + 30 сек polling (v1); SSE дараа нь |
| `claude.use('user')` | NextAuth (credentials + hash). Редактор/админд 2FA — 2-р шат |
| `claude.use('assets')` | Vercel Blob (`@vercel/blob` аль хэдийн `apps/web`-д байна) |
| `claude.use('downloads')` (RSS) | `/rss.xml` route handler |
| `claude.use('tts')`, `dictation` | Web Speech API (хөтөч), v1-д сонголттой |
| `claude.use('sample')` (AI засвар) | Серверийн route + Claude API, түлхүүр нуугдана — 2-р шат |

### 5.6 Нийтийн сайтын хуудаснууд

`/` · `/news/<slug>` · `/c/<category>` · `/tag/<tag>` · `/live` · `/video` ·
`/search` · `/bill/<id>` · `/story/<id>` · `/rss.xml` · `/sitemap.xml` · `/robots.txt`

Мэдээ бүрт `generateMetadata` + `opengraph-image`. ISR, нийтлэхэд `revalidateTag`.

**3D номын тавиур:** SSR-д мэдээний HTML жагсаалт гарч, тавиур нь client component
болж hydrate хийнэ. Ингэснээр SEO болон JS унтарсан үед агуулга харагдана.

## 6. Хэрэгжүүлэх дараалал

1. **Схем + нэвтрэлт/эрх** — Prisma моделиуд, migration, tenant middleware, эрхийн модуль, seed (parlament tenant + 8 ангилал + эрхүүд)
2. **Нийтийн сайт + SEO** — `/news/<slug>`, нүүр, ангилал, хайлт, sitemap/RSS/OG.
   Нэг tenant тул кэшийн тусгай бэлтгэл шаардахгүй: хуудас статик/ISR байж чадна
3. **Редакцын систем** — урсгал, Tiptap редактор, медиа байршуулалт, тохиргоо, баг ба эрх
4. **Модулиуд** — хуулийн төсөл, хуваарь/ирц/ШУУД, баннер, стори, ханш
5. **Сошиал нийтлэл + мэдэгдэл** — queue, Meta/YouTube/Telegram
6. **Хамгаалалт ба нээлт** — rate limit, нөөц хуулбар, ачааллын тест, Cloudflare

## 7. Деплой

Хоёр дахь Vercel project: Root Directory = репогийн эх, домэйн `parlamentnews.mn`,
build нь мэдээний client-ыг үүсгэнэ:

```
cd packages/db-news && pnpm exec prisma generate --schema=prisma/schema.prisma && cd ../../apps/parliament-news && pnpm exec next build
```

`apps/web`-ийн одоогийн деплой хөндөгдөхгүй. Нээлтийн өмнөх бүрэн шалгах жагсаалт:
`apps/parliament-news/DEPLOY-CHECKLIST.md`.

## 8. Эрсдэл ба шийдэх асуултууд

**Бизнес (хөгжүүлэлтээс гадна, нээлтээс өмнө шийдэх)**
- **Эзэмшил:** хожим захиалагч байгууллага гарч ирвэл «платформ нь Нүүл Дижиталынх,
  өгөгдөл нь захиалагчийнх» гэдгийг бичгээр тохирох. Мэдээний сан тусдаа байгаа тул
  шилжүүлэх нь сан бүхэлдээ хөдөлнө
- Hosting, Cloudflare, Vercel-ийн зардлыг хэн хариуцах
- ~~Брэндийн өнгө зөрчилтэй~~ — **шийдэгдсэн (2026-11-26): `#0A22E0`**, `site-v2`-ийн
  токен эх сурвалж болно. 2-р шатны Task 5 нь `tailwind.config.ts`-ээс `brand`/`accent`-ийг
  хасаж, artifact-ийн токенуудыг цорын гагц системээр тавина — хоёр өнгөний систем
  зэрэгцэж байх нь хойшид зөрүү үүсгэнэ
- Ангиллын эцсийн жагсаалт (одоо `DEFC`-ийн 8 ангилал seed болно)
- Анхны редакцын хэрэглэгчид ба эрх

**Техникийн эрсдэл**
- ~~Нэг DB-д хамтдаа байх нь хожим эзэмшлийг салгахад migration шаардана~~ —
  хувилбар C-ээр шийдэгдсэн: мэдээний сан эхнээсээ тусдаа
- Кирилл гарчгийн латин slug — давхардлыг `-2` суффиксээр
- 400KB artifact дизайныг дахин бичих цаг нь хамгийн том тооцоолох эрсдэл
- **Vercel-ийн сүлжээний хоцролт Монголд (2026-11-26-нд Улаанбаатараас хэмжсэн).**
  `montsame.mn` нь Vercel дээр байдаг тул бодит хэмжүүр болов: TTFB **385 мс**,
  кэш оногдсон байхад ч (`X-Vercel-Id: hkg1` — хамгийн ойрын edge нь Хонг Конг).
  Дотоодод байршсан `ikon.mn` 93 мс, `gogo.mn` 68 мс. Зөвхөн Vercel дээр бол
  уншигчид тэргүүлэгчээс 4 дахин хоцрох хариу авна.

  Cloudflare-д **Улаанбаатарт POP байна** (`colo=ULN`, `loc=MN` — шалгасан).
  Нийтийн хуудсууд ISR/статик, хэрэглэгчээр хувьсдаггүй тул CDN-ийн edge-д
  кэшлэгдэж чадна — нэг сайт болгож `/`-ийг статик болгосны бодит үнэ цэн нь энэ.
  Гэхдээ Cloudflare-ийг зүгээр урд тавих нь хүрэлцэхгүй: `zarig.mn`, `eagle.mn`
  хоёул Cloudflare дээр байгаа боловч `cf-cache-status: DYNAMIC` тул хүсэлт бүр
  origin хүртэл явж, 188 мс ба 439 мс болж байна. HTML-ийг кэшлэх дүрэм зориуд
  бичих шаардлагатай.

  Энэ нь **хоёр давхар кэшийн хүчингүй болголт** үүсгэнэ (нийтлэхэд Vercel-ийн
  ISR ба Cloudflare-ийн кэш хоёуланг цэвэрлэх). Тиймээс Cloudflare-ийн HTML
  кэшийг 2-р шатад тавихгүй — редакцын нийтлэх үйлдэл гарч ирэх 3-р шатад,
  cache purge-тэй хамт нэг хянагдах өөрчлөлтөд оруулна.
- **Зураг: өрсөлдөгчдийн хоосон зай (мөн 2026-11-26-нд хэмжсэн).** ikon.mn 296 KB,
  gogo.mn 335 KB, news.mn 466 KB — гурвуулаа JPEG, `Accept: image/webp` гуйсан ч
  JPEG буцаана, `Vary: Accept` header ч тавихгүй. `next/image` нь WebP/AVIF-ийн
  content negotiation ба responsive `srcset`-ийг автоматаар хийдэг тул гурав
  дахин жижиг зураг нь сонгосон framework-ээс үнэгүй ирнэ. Монголын мэдээний
  хөдөлгөөний дийлэнх нь мобайл тул энэ нь уншигчид мэдрэгдэх хамгийн хямд
  давуу тал — 2-р шатны Task 6.

## 9. Хөгжүүлэгчид үлдэх шийдвэрүүд

Файлын бүтэц, компонентын хуваалт, Tailwind токен, тестийн нэр, медиа хэмжээ,
кэшийн нарийн тохиргоо, Prisma талбарын төрлийн дэлгэрэнгүй.
