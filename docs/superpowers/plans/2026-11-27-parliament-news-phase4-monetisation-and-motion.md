# Parliament News 4-р шат — орлого, агуулга, удирдлага, хөдөлгөөн

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Редакц мэдээгээ бүрэн эрхтэй бэлтгэж, сайтаа өөрөө удирдаж, зар борлуулж чаддаг болгох — баян текст, баннерын систем, лого/цэсний удирдлага, босоо видео стори, нүүрний шууд дамжуулалт, хөдөлгөөн.

**Architecture:** Бүх шинэ логик нь `lib/`-ийн ЦЭВЭР модуль (DOM-гүй, Prisma-гүй) + түүнийг зурах нимгэн компонент гэсэн хоёр давхаргаар. Хадгалсан агуулгыг HTML болгон хувиргах газар ГАНЦ (`lib/rich-text.ts`) бөгөөд гаргалт нь бүтэцлэгдсэн блокууд — `dangerouslySetInnerHTML` ХЭРЭГЛЭХГҮЙ, тул sanitize-ийн шийдвэр тасардахгүй. Гадны контент (сошиал шигтгээ, баннерын видео) нь зөвшөөрөгдсөн хостын цагаан жагсаалтаар л нэвтэрнэ.

**Tech Stack:** Next.js 14.2 App Router (RSC), Prisma 5.22 + Postgres, tRPC, Vitest 2, `@vercel/blob`, CDP-д суурилсан хөтчийн шалгуур (`scripts/browser-check.mjs`).

**Spec:** `apps/parliament-news/site-v2/index.html` (нийтийн тал), `apps/parliament-news/site-v2/admin.html` (редакцын тал). Хоёулаа энэ репод байгаа дизайны эх сурвалж; зөрөх бүрт шалтгааныг нь кодын тайлбарт бичнэ.

## Global Constraints

- Монгол хэлний UI текст — тайлбар, commit, тестийн нэр бүгд монголоор.
- `--accept-data-loss` ХЭЗЭЭ Ч хэрэглэхгүй. Схем өөрчлөхийн өмнө `pg_dump`-аар нөөцлөнө.
- `prisma migrate dev` ажиллуулахгүй (migrations хавтас байхгүй — reset санал болгоно). Зөвхөн `prisma db push`.
- Энэ төлөвлөгөөнд схемийн ХОЁР Л нэмэлт зөвшөөрөгдсөн: `Banner.kind`, `NewsPost.storyUrl`. Хоёулаа анхны утгатай, байгаа мөрүүдийг хөндөхгүй.
- `eslint-disable` тайлбар бичихгүй.
- `next dev` ажиллаж байхад `next build` ажиллуулахгүй (`.next` эвдэрнэ).
- Хөтчийн шалгуурын гэрэлтүүлгийн тооцоог Node талд бичнэ — хуудсан доторх template-ийн дотор template нь `\d`-г `d` болгодог.
- Гадны эх сурвалжаас ирэх URL бүр цагаан жагсаалтаар шалгагдана; `javascript:` протокол ХЭЗЭЭ Ч нэвтрэхгүй.
- Шинэ нийтийн бичих зам (сэтгэгдэл, зар хүсэх форм) ЭНЭ төлөвлөгөөнд ОРОХГҮЙ — хурдны хязгаар, бот хамгаалалт тусдаа шийдвэр.

## Review Focus

1. **Баян текстэд хортой тэмдэгт** — редактор `<script>`, `<img onerror=…>`, `javascript:` холбоос бичвэл уншигчид ХЭЗЭЭ Ч ажиллах ёсгүй; блок нь текст болж гарна.
2. **Танихгүй хостын шигтгээ** — X, YouTube, Facebook БИШ хаяг оруулбал iframe үүсэхгүй, энгийн холбоос болно.
3. **Хугацаа нь дууссан баннер** — `endsOn` нь өчигдөр байх зартай мөр нийтийн талд гарах ёсгүй; `startsOn` нь ирээдүйд байх нь мөн адил.
4. **Баннер огт байхгүй** — зарын талбай хоосон нүх үлдээхгүй, «Таны зар энд байрлана» гэсэн гэрийн зар гарна.
5. **Хөдөлгөөн хаасан хэрэглэгч** — `prefers-reduced-motion: reduce` үед илчлэх анимаци БҮГД унтарч, агуулга нь шууд харагдана (далд үлдэхгүй).

---

## Файлын бүтэц

| Файл | Хариуцлага |
|---|---|
| `lib/rich-text.ts` | Хадгалсан текстийг БҮТЭЦЛЭГДСЭН блок болгоно (parse). HTML үүсгэхгүй. |
| `lib/embeds.ts` | Сошиал хаяг → шигтгээний тодорхойлолт. Цагаан жагсаалт. |
| `components/article/rich-body.tsx` | Блокуудыг React-ээр зурна. |
| `lib/banner.ts` | Баннерын цэвэр дүрмүүд — байршил, хугацаа, медиа төрөл. |
| `lib/banner-data.ts` | Нийтийн баннерын уншилт. |
| `components/ads/ad-slot.tsx` | `.adw` — урсдаг слайдер, гэрийн зар. |
| `app/(site)/ads/page.tsx` | «Сурталчилгаа байршуулах» — үнийн санал. |
| `components/studio/admin/banner-panel.tsx` | Баннерын засварлагч (upload, хэмжээ, хугацаа, үнэ). |
| `lib/site-chrome.ts` (өргөтгөх) | Лого, цэсний мөрүүдийн загвар. |
| `components/studio/admin/header-panel.tsx` | Лого upload, толгойн байрлал, цэсний мөр засах. |
| `lib/story-media.ts` | Сторины босоо медиа — зураг/видео ялгах, харьцаа. |
| `components/hero/live-box.tsx` | Нүүрний шууд дамжуулалтын тоглуулагч. |
| `components/motion/reveal.tsx` | Гүйлгэхэд илчлэх бүрхүүл. |
| `lib/motion.ts` | Хөдөлгөөний цэвэр дүрмүүд (reduced-motion, дараалал). |

---

## Task 1: Схемийн хоёр багана

**Files:**
- Modify: `packages/db-news/prisma/schema.prisma` (`Banner`, `NewsPost`)
- Test: `apps/parliament-news/lib/schema-shape.db.test.ts` (шинэ)

**Interfaces:**
- Produces: `Banner.kind: string` (анхдагч `"image"`), `NewsPost.storyUrl: string | null`

- [ ] **Step 1: Өгөгдлийн санг нөөцлөх**

```bash
docker exec parlamentnews-pg pg_dump -U parlament parlamentnews > backup-phase4.sql
```
Expected: файл 0-ээс том.

- [ ] **Step 2: Унах тест бичих**

`schema-shape.db.test.ts`: `it("баннер медиа төрлөө хадгална")` — `prisma.banner.create({ data: { …, kind: "video" } })` үүсгээд буцааж уншина, `kind === "video"`. `it("мэдээ сторины босоо медиатай")` — `storyUrl` бичээд уншина.

- [ ] **Step 3: Тест унахыг шалгах**

Run: `npx vitest run lib/schema-shape.db.test.ts`
Expected: FAIL — `Unknown argument 'kind'`.

- [ ] **Step 4: Схемд нэмэх**

`Banner`-т `kind String @default("image")`, `NewsPost`-д `storyUrl String?`.

- [ ] **Step 5: db push**

Run: `cd packages/db-news && pnpm db:push` (`--accept-data-loss` БИШ)
Expected: «Your database is now in sync», алдагдал мэдэгдэхгүй.

- [ ] **Step 6: Тест ногоон болохыг шалгах** — Expected: PASS

- [ ] **Step 7: Commit**

---

## Task 2: Баян текстийн задлагч

**Files:**
- Create: `apps/parliament-news/lib/rich-text.ts`, `lib/rich-text.test.ts`

**Interfaces:**
- Produces:
  - `type Block = {kind:"p"|"h3"|"quote"|"pull", spans: Span[]} | {kind:"img", url:string, caption:string|null} | {kind:"embed", embed: Embed} | {kind:"list", items: Span[][]}`
  - `type Span = {text:string, bold?:boolean, italic?:boolean, href?:string}`
  - `parseRich(body: string | null): Block[]`

- [ ] **Step 1: Унах тест бичих**

Тестийн нэрс ба батламжууд (artifact-ийн `richBody` ба `inl`-ийн дүрэм):
- `"## гарчиг нь h3 блок"` → `parseRich("## Та")[0].kind === "h3"`
- `"> эхэлсэн мөр нь ишлэл"` → `kind === "quote"`
- `">> эхэлсэн мөр нь ОНЦЛОХ ишлэл"` → `kind === "pull"`
- `"- эхэлсэн дараалсан мөрүүд нэг жагсаалт болно"` → `kind === "list"`, `items.length === 3`
- `"**тод** ба *налуу*"` → span-ууд `bold`, `italic` тугтай
- `"[текст](https://a.mn) нь холбоос"` → `href === "https://a.mn"`
- `"http биш холбоосыг ТЕКСТ болгоно"` → `[x](javascript:alert(1))` → `href` undefined, текст нь хэвээр
- `"[[img:https://…|тайлбар]] нь зургийн блок"` → `kind === "img"`, `caption === "тайлбар"`
- `"[[embed:https://x.com/a/status/1]] нь шигтгээ"` → `kind === "embed"`
- `"хоосон текст нь хоосон массив"` → `parseRich("") → []`
- `"HTML таг нь ТЕКСТ — <script> ажиллахгүй"` → `parseRich("<script>x</script>")[0].spans[0].text` нь тэр мөрийг бүтнээр агуулна, `kind === "p"`

- [ ] **Step 2: Тест унахыг шалгах** — Expected: FAIL, модуль байхгүй.

- [ ] **Step 3: `parseRich` хэрэгжүүлэх**

Блокийн заагч нь хоосон мөр (`paragraphs()`-тай ижил). Мөрийн эхний тэмдгээр төрлийг нь тогтоож, `**`/`*`/`[…](…)`-г span болгоно. HTML-ийг ТАЙЛАХГҮЙ — текст хэвээр үлдэх нь аюулгүй байдлын тулгуур.

- [ ] **Step 4: Тест ногоон** — Expected: PASS

- [ ] **Step 5: Commit**

---

## Task 3: Сошиал шигтгээний цагаан жагсаалт

**Files:**
- Create: `apps/parliament-news/lib/embeds.ts`, `lib/embeds.test.ts`

**Interfaces:**
- Consumes: Task 2-ийн `Block` төрөл
- Produces: `type Embed = {host:"x"|"youtube"|"facebook", src:string, ratio:string}`, `parseEmbed(url: string): Embed | null`

- [ ] **Step 1: Унах тест бичих**

- `"YouTube watch хаягийг embed болгоно"` → `youtube.com/watch?v=abc` → `src` нь `https://www.youtube.com/embed/abc`
- `"youtu.be богино хаяг"` → мөн адил
- `"X-ийн status"` → `host === "x"`
- `"Facebook видео"` → `host === "facebook"`
- `"танихгүй хост нь null"` → `parseEmbed("https://evil.mn/a") === null`
- `"javascript: протокол нь null"`
- `"http (найдваргүй) нь null"` → зөвхөн https

- [ ] **Step 2: Тест унахыг шалгах** — Expected: FAIL

- [ ] **Step 3: `parseEmbed` хэрэгжүүлэх** — `URL` задлагчаар host шалгана, регексээр биш: `youtube.com.evil.mn` нь YouTube БИШ.

- [ ] **Step 4: Тест ногоон** — Expected: PASS

- [ ] **Step 5: Commit**

---

## Task 4: Баян текстийн дүрслэл, нийтлэлд холбох

**Files:**
- Create: `apps/parliament-news/components/article/rich-body.tsx`
- Modify: `app/(site)/news/[slug]/page.tsx` (`.dbody` хэсэг)
- Modify: `scripts/browser-check.mjs` (B1–B3 шалгуур)

**Interfaces:**
- Consumes: `parseRich`, `parseEmbed`
- Produces: `<RichBody body={string|null} />`

- [ ] **Step 1: Хөтчийн шалгуур бичих**

`B1 дэд гарчиг h3 болж гарна`, `B2 ишлэл blockquote`, `B3 шигтгээ зөвхөн зөвшөөрөгдсөн хостоос iframe` — нийтлэлийн хуудсыг нээж DOM-оос тоолно.

- [ ] **Step 2: Шалгуур унахыг шалгах**

Run: `node scripts/browser-check.mjs http://127.0.0.1:3014`
Expected: B1–B3 FAIL.

- [ ] **Step 3: `RichBody` бичиж нийтлэлд холбох**

Блок бүрийг React элемент болгоно. `dangerouslySetInnerHTML` ХЭРЭГЛЭХГҮЙ. `embed` нь `<iframe loading="lazy" referrerPolicy="no-referrer">`; `parseEmbed` null буцаавал энгийн `<a>`.

- [ ] **Step 4: Шалгуур ногоон** — Expected: B1–B3 PASS

- [ ] **Step 5: Commit**

---

## Task 5: Баннерын цэвэр дүрмүүд ба уншилт

**Files:**
- Create: `apps/parliament-news/lib/banner.ts`, `lib/banner.test.ts`, `lib/banner-data.ts`, `lib/banner-data.db.test.ts`

**Interfaces:**
- Consumes: Task 1-ийн `Banner.kind`
- Produces:
  - `type Placement = "home" | "article" | "side" | "both" | "all"`
  - `type AdItem = {id:string; url:string; kind:"image"|"video"; link:string|null; title:string|null}`
  - `visibleBanners(rows, place: Placement, now: Date): AdItem[]`
  - `bannerKind(url: string): "image" | "video"`
  - `banners(place: Placement): Promise<AdItem[]>`

- [ ] **Step 1: Унах тест бичих**

- `"хугацаа нь эхлээгүй баннер гарахгүй"` — `startsOn` маргааш
- `"хугацаа нь дууссан баннер гарахгүй"` — `endsOn` өчигдөр
- `"хугацаагүй баннер ҮРГЭЛЖ гарна"` — хоёулаа null
- `"both нь нийтлэлд гарахгүй"` — artifact-ийн `adBlock` дүрэм
- `"all нь хаана ч гарна"`
- `"javascript: холбоос нь холбоосгүй болно"` — зураг нь үлдэнэ, холбоос нь хасагдана
- `"bannerKind нь .mp4-ийг видео гэнэ"`, `"GIF нь зураг"`
- DB тест: `"нийтийн уншилт нь дарааллыг хадгална"`

- [ ] **Step 2: Тест унахыг шалгах** — Expected: FAIL

- [ ] **Step 3: Хэрэгжүүлэх** — `visibleBanners` нь цэвэр; `banners()` нь `forTenant`-аар уншаад түүгээр шүүнэ.

- [ ] **Step 4: Тест ногоон** — Expected: PASS

- [ ] **Step 5: Commit**

---

## Task 6: Зарын талбай — урсдаг слайдер ба гэрийн зар

**Files:**
- Create: `apps/parliament-news/components/ads/ad-slot.tsx`
- Modify: `app/(site)/page.tsx` (нүүр), `app/(site)/news/[slug]/page.tsx` (нийтлэл)
- Modify: `scripts/browser-check.mjs` (A1–A3)

**Interfaces:**
- Consumes: `banners(place)`
- Produces: `<AdSlot place={Placement} items={AdItem[]} />`

- [ ] **Step 1: Хөтчийн шалгуур бичих**

`A1 зарын талбай нүүрэнд байна`, `A2 зар байхгүй үед гэрийн зар гарна` (`.hous` + «Таны зар энд байрлана»), `A3 хоёроос дээш зар байвал слайдер цэгтэй`.

- [ ] **Step 2: Шалгуур унахыг шалгах** — Expected: A1–A3 FAIL

- [ ] **Step 3: `AdSlot` бичиж хоёр хуудсанд холбох**

`.adw` бүрхүүл, `<small>ЗАР</small>` шошго (artifact-ийн дүрэм: зар нь ҮРГЭЛЖ шошготой). Нэгээс олон бол авто урсдаг (6 секунд) + цэгүүд; `prefers-reduced-motion` үед авто урсахгүй. Видео нь `muted autoPlay loop playsInline` — дуутай авто тоглуулахгүй. Гадаад холбоос нь `rel="noopener sponsored"`.

- [ ] **Step 4: Шалгуур ногоон** — Expected: A1–A3 PASS

- [ ] **Step 5: Commit**

---

## Task 7: Студийн баннер засварлагч ба үнийн хуудас

**Files:**
- Create: `apps/parliament-news/components/studio/admin/banner-panel.tsx`, `app/(site)/ads/page.tsx`
- Modify: `server/routers/studio-admin.ts` (`banners` mutation), `lib/studio-admin.ts` (`settingsData`-д `kind`, огноо, үнэ), `components/studio/admin/settings-form.tsx`

**Interfaces:**
- Consumes: `AdItem`, `bannerKind`
- Produces: tRPC `studioAdmin.banners({ rows })`; `/ads` нийтийн хуудас

- [ ] **Step 1: DB тест бичих**

`server/routers/studio-admin.db.test.ts`-д нэмнэ: `"баннер хадгалагдана"`, `"blob биш хост татгалзана"` (одоогийн `BLOB_HOST` дүрэм), `"эхлэх огноо нь дуусах огнооноос хойш бол татгалзана"`, `"сэтгүүлч баннер засахгүй"` (FORBIDDEN).

- [ ] **Step 2: Тест унахыг шалгах** — Expected: FAIL

- [ ] **Step 3: Mutation ба панел бичих**

Панел нь `/api/upload`-аар зураг/GIF/видео оруулна (одоогийн `checkUpload` хязгаар хэвээр). Мөр бүрт: байршил, хэмжээний шошго, холбоос, эхлэх/дуусах огноо, төлбөр төлсөн эсэх, дүн.

- [ ] **Step 4: Тест ногоон** — Expected: PASS

- [ ] **Step 5: `/ads` хуудас**

`AdRate` мөрүүдийг хүснэгтээр, `footer.sales` и-мэйл рүү холбоостой. Хөл дэх «Сурталчилгаа байршуулах» холбоос энд заана.

- [ ] **Step 6: Commit**

---

## Task 8: Лого ба цэсний бүрэн удирдлага

**Files:**
- Modify: `lib/settings.ts` (`headerSchema`-д `logoLight`, `logoDark`, `nav`), `components/site-chrome.ts`, `components/site-header.tsx`, `components/studio/admin/settings-form.tsx`
- Create: `components/studio/admin/header-panel.tsx`
- Test: `components/site-chrome.test.ts` (өргөтгөх), `lib/settings.test.ts`

**Interfaces:**
- Produces: `headerSchema` нь `logoLight: string`, `logoDark: string`, `nav: {label:string; href:string; show:boolean}[]`; `headerModel` нь логоны хаяг ба эцсийн цэсийг буцаана.

- [ ] **Step 1: Унах тест бичих**

- `"лого оруулаагүй бол анхны файл руу эргэнэ"` → `/artifact/logo.png`
- `"blob биш хаягийг татгалзана"`
- `"нуусан цэсний мөр гарахгүй"`
- `"цэсний дараалал тохиргооных"`
- `"цэс хоосон бол ангиллаар эргэнэ"` — одоогийн зан хэвээр

- [ ] **Step 2: Тест унахыг шалгах** — Expected: FAIL

- [ ] **Step 3: Хэрэгжүүлэх** — `headerSchema` өргөтгөж, `headerModel`-д логоны хаяг нэмж, толгойг түүгээр зурна.

- [ ] **Step 4: Тест ногоон** — Expected: PASS

- [ ] **Step 5: Студийн панел** — лого upload (гэрэл/бараан), байрлал, хэмжээ, цэсний мөр нэмэх/нуух/эрэмбэлэх.

- [ ] **Step 6: Commit**

---

## Task 9: Босоо видео стори

**Files:**
- Create: `apps/parliament-news/lib/story-media.ts`, `lib/story-media.test.ts`
- Modify: `components/studio/editor/section-pub.tsx` (сторины медиа оруулах), `components/hero/story-viewer.tsx`, `components/hero/stories-rail.tsx`, `lib/posts.ts` (`storyUrl`-г `PostListItem`-д)

**Interfaces:**
- Consumes: Task 1-ийн `NewsPost.storyUrl`
- Produces: `storyMedia(post): {src:string; video:boolean}` — `storyUrl` → түүний медиа, байхгүй бол зураг, тэр ч байхгүй бол текстгүй хавтас.

- [ ] **Step 1: Унах тест бичих**

- `"босоо медиа байвал түүнийг"`, `"байхгүй бол мэдээний зураг"`, `"аль нь ч байхгүй бол текстгүй хавтас"`, `"видеог өргөтгөлөөр таних"`, `"зөвшөөрөгдөөгүй хост нь хавтас руу эргэнэ"`

- [ ] **Step 2: Тест унахыг шалгах** — Expected: FAIL

- [ ] **Step 3: Хэрэгжүүлэх ба үзүүлэгчид холбох** — видео нь `muted playsInline` авто тоглоно, дараагийнх руу дуусмагц шилжинэ.

- [ ] **Step 4: Тест ногоон + хөтчийн шалгуур** `S1 стори видеотой нээгдэнэ`

- [ ] **Step 5: Commit**

---

## Task 10: Нүүрний шууд дамжуулалт

**Files:**
- Create: `apps/parliament-news/components/hero/live-box.tsx`
- Modify: `components/home-feed.tsx` (одоогийн текст холбоосыг солино), `app/(site)/page.tsx`
- Modify: `scripts/browser-check.mjs` (L1–L2)

**Interfaces:**
- Consumes: Task 3-ийн `parseEmbed`, `LiveInfo` (`liveOn`, `liveUrl`)
- Produces: `<LiveBox live={LiveInfo|null} />`

- [ ] **Step 1: Хөтчийн шалгуур бичих**

`L1 шууд асаалттай үед тоглуулагч гарна`, `L2 унтраалттай үед блок огт гарахгүй`.

- [ ] **Step 2: Шалгуур унахыг шалгах** — Expected: FAIL

- [ ] **Step 3: `LiveBox` бичих** — `parseEmbed(liveUrl)` ажиллавал iframe, эс бөгөөс холбоос. Улаан цохилж буй «ШУУД» тэмдэг (одоогийн `.lvp` анимаци).

- [ ] **Step 4: Шалгуур ногоон** — Expected: L1–L2 PASS

- [ ] **Step 5: Commit**

---

## Task 11: Хөдөлгөөн

**Files:**
- Create: `apps/parliament-news/lib/motion.ts`, `lib/motion.test.ts`, `components/motion/reveal.tsx`
- Modify: `app/globals.css` (илчлэх шилжилт), нүүр ба нийтлэлийн блокууд
- Modify: `scripts/browser-check.mjs` (M1–M2)

**Interfaces:**
- Produces: `revealDelay(index: number): number` (дээд хязгаартай, шаталсан), `<Reveal delay>`

- [ ] **Step 1: Унах тест бичих**

- `"шаталсан саатал нь 400мс-ээс хэтрэхгүй"` — арван карт нэг нэгээр гарч, арав дахь нь хагас секунд хүлээхгүй
- Хөтчийн: `M1 блокууд гүйлгэхэд илчлэгдэнэ`, `M2 reduced-motion үед агуулга ШУУД харагдана`

- [ ] **Step 2: Тест унахыг шалгах** — Expected: FAIL

- [ ] **Step 3: Хэрэгжүүлэх** — `IntersectionObserver`; `prefers-reduced-motion: reduce` үед ажиглагч огт үүсгэхгүй, эхний төлөв нь ил.

- [ ] **Step 4: Тест ногоон** — Expected: PASS

- [ ] **Step 5: Commit**

---

## Task 12: Зураг оруулах урсгал

**Files:**
- Modify: `apps/parliament-news/components/studio/editor/section-media.tsx`, `components/studio/editor/editor-form.tsx`
- Modify: `app/api/upload/route.ts` (ноорог хараахан хадгалаагүй үед)
- Test: `lib/upload.test.ts` (өргөтгөх), хөтчийн `U1`

**Interfaces:**
- Consumes: одоогийн `checkUpload`, `/api/upload`
- Produces: зураг нь мэдээг ХАДГАЛАХААС ӨМНӨ оруулагдана; оруулсан эхний зураг нь хавтасны зураг болно.

**Яагаад:** одоо засварлагч «Эхлээд мэдээгээ хадгална уу» гэж хэлдэг. Сэтгүүлч гарчиг бичихээсээ өмнө зургаа сонгох нь ердийн урсгал — хадгалах хүртэл хүлээлгэх нь ажлыг тасалдуулж байна.

- [ ] **Step 1: Унах тест бичих**

- `lib/upload.test.ts`: `"ноорогт зураг оруулахыг зөвшөөрнө"` — `checkUpload` нь `postId` байхгүй үед ч зөвшөөрнө
- Хөтчийн `U1 шинэ мэдээнд зургийн талбай идэвхтэй` — «Эхлээд мэдээгээ хадгална уу» гэсэн текст БАЙХГҮЙ

- [ ] **Step 2: Тест унахыг шалгах** — Expected: FAIL

- [ ] **Step 3: Хэрэгжүүлэх**

Хадгалаагүй үед зургийг blob-д тавиад хаягийг нь редакторын төлөвт барина; `save` үед `attachMedia`-гаар мэдээнд холбоно. Хаалга хэвээр: `studioSession()` ба `SECTIONS[role]`-д `photos` байх шаардлага хөндөгдөхгүй.

- [ ] **Step 4: Тест ногоон** — Expected: PASS

- [ ] **Step 5: Commit**

---

## Эцсийн алхам

- [ ] Бүх цуглуулга: `pnpm test`, `pnpm test:db`, `pnpm lint`, `npx tsc --noEmit`
- [ ] `next dev` зогсоож, `pnpm build`, дараа нь `pnpm start -p 3014` дээр `pnpm check:browser`
- [ ] Шинэ нүүр, нийтлэл, цэс, студийн зураг авч харьцуулах
- [ ] Салбарыг `master` руу нэгтгэх
