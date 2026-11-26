# Нүүр хуудсыг artifact-тай тэнцүү болгох (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `parlamentnews.mn`-ийн нүүр хуудсыг `site-v2/index.html` artifact-ийн дизайнтай нүдээр ялгагдахааргүй болгох — 3D номын тавиур бүтэн, ирц/хуваарь/ШУУД/стори виджетүүд бодит өгөгдлөөр.

**Architecture:** Дизайныг гараар дахин гаргахгүй. Artifact-ийн 78 KB / 959 дүрэм CSS-ийг **бүтнээр** зөөж дизайны эх сурвалж болгоно; DOM-ийг нь React компонент болгон тэр бүтцээр барьж, Prisma-гийн өгөгдлөөр тэжээнэ; тавиурын хөдөлгөөнийг (пүршин байрлал, −90° нээгдэх эргэлт, хулганы налалт, талуудын сүүдэр) artifact-аас гаргасан томьёогоор нэг hook болгоно. Хориг нь JS-ийг хуулахад байсан — CSS бол дизайн өөрөө.

**Tech Stack:** Next.js 14.2 App Router, React 18.3, TypeScript 5.5 strict, artifact-ийн CSS (глобал) + Tailwind (шинэ зүйлд), Prisma 5.22 (`@nuul/db-news`), Vitest 2.

**Spec (эрх бүхий):** `apps/parliament-news/site-v2/index.html` — дизайн нь энэ файл өөрөө.
**Платформын дизайн:** `docs/superpowers/specs/2026-11-25-parliament-news-platform-design.md`
**2-р шатны ledger:** `.superpowers/sdd/2026-11-26-parliament-news-phase2-public-site/progress.md`

---

## Global Constraints

- **Artifact-ийн CSS нь дизайны эх сурвалж.** Зөрчилдвөл artifact ялна: тиймээс `globals.css`-ийн (Tailwind) ДАРАА импортлоно. Tailwind-ийг хасахгүй — 2-р шатны нийтлэл, ангилал, хайлтын хуудас түүгээр бичигдсэн, тэд энэ төлөвлөгөөний хүрээнд биш.
- **Artifact-ийн JS-ийг хуулахгүй** (дизайн бичгийн anti-goal). Томьёог нь авч, React-д дахин бичнэ.
- Нийтийн уншилт бүр `lib/posts.ts`-ийн хаалгаар. Шинэ модулиудад (ирц, хуваарь, ШУУД) мөн tenant-д хаагдсан клиент — `prisma`-г шууд дуудахгүй.
- `$queryRaw` / `$executeRaw` хориотой (lint).
- **`eslint-disable`-ээр тохируулаагүй дүрэм заахгүй** — репод плагины дүрэм ачаалагддаггүй тул коммэнт өөрөө алдаа болж `next build`-ийг унагана (2-р шатанд хоёр удаа тохиолдсон).
- **`next dev` ажиллаж байхад `pnpm build` хийхгүй** — `.next` эвдэрч бүх динамик зам 500 болдог, логт юу ч гарахгүй.
- Схемд өөрчлөлт ОРУУЛАХГҮЙ: `LiveState`, `Agenda`, `TickerAd`, `Bill`/`BillStage`, `NewsPost.story`/`storyUntil` бүгд 1-р шатанд загварчлагдсан.
- `apps/web` (nuul.mn) эвдрэхгүй — даалгавар бүрийн төгсгөлд `pnpm --filter @nuul/web build` ногоон.

### Artifact-аас гаргасан тавиурын геометр (үг дуудлагаар)

Эдгээр нь `index.html`-ийн `measure()`, `frame()`-ээс авсан яг утгууд. Таамаглахгүй, эндээс хуулна.

```
P   = 1400                       // perspective
H   = #probe элементийн өндөр    // CSS --H-ийн бодит px утга
ws  = H * 0.25                   // нурууны өргөн = номын зузаан
d   = H * 0.62                   // хавтасны өргөн
gap = H * 0.035
U   = H * (өргөн < 768 ? 1.05 : 1.3)
XS  = тоон интеграл: u = 0..3U алхам 2 бүрт  XS.push(a); a += 2/(1+(u/U)**1.6)
```

Дөрвөн тал нь `ws × H × d` хайрцаг үүсгэнэ:

| Тал | Өргөн | left | transform |
|---|---|---|---|
| `sp` нуруу | `ws` | `-ws/2` | `translateZ(d/2)` |
| `cv` хавтас | `d` | `-d/2` | `rotateY(90deg) translateZ(ws/2)` |
| `bk` ар | `d` | `-d/2` | `rotateY(-90deg) translateZ(ws/2)` |
| `fe` хуудасны ирмэг | `ws*0.94` | `-ws*0.47` | `rotateY(180deg) translateZ(d/2 - 3)` |

Кадр бүрийн тооцоо (`v` нь номын индекс, `s` нь бутархай байрлал):

```
r  = rel(v, s)                   // ((v-s) % TOT + TOT) % TOT;  r >= TOT/2 ? r-TOT : r
o  = sm(max(0, 1-|r|))           // sm(x) = x*x*(3-2*x)
u  = F(r)                        // r*(ws+gap) + (d-ws+1.4*gap)*B(r)
                                 // B(r) = |r|<1 ? (r + sin(πr)/π)/2 : sign(r)*0.5
sc = 1/(1 + (|u|/U)**1.6)
kk = 1/sc
z  = P*(1-kk) + o*H*0.1
x  = xsc(u)*kk                   // xsc(u) = sign(u)*XS[min(XS.length-1, floor(|u|/2))]
y  = (H*0.5*(1-sc)*0.42 + o*H*0.012 - lift*H*0.05) * kk
ry = sign(u)*min(1, |u|/U)*26*(1-o) - 90*o + tY*o
rx = tX*o
zIndex = round(3000 + z)
|u| > U*1.95 бол display:none
сүүдэр: sp --shade = min(.6, o*.55 + (1-sc)*.32);  cv --shade = (1-o)*.82;  bk --shade = .5
```

Пүрш ба налалт:

```
dt   = min(0.05, (now - last)/1000)
k    = чирч байвал 18, үгүй бол 5.2
s   += (T - s) * (1 - exp(-k*dt))        // reduced-motion үед s = T шууд
e7   = 1 - exp(-7*dt)
tY  += ((төвд ? (mx-W/2)/(0.55*d)*8 : (mx-W/2)/W*4) - tY) * e7
tX  += ((төвд ? -(my-scy)/(H/2)*5 : 0) - tX) * e7
тайз: rotateX(tX*0.25) rotateY(3.5*sin(s/L*2π) + tY*0.5)
```

`TOT = L*3` — гурван хуулбараар тойрог хаалттай болно. `HK` нь artifact-д бүгд `1` тул номын өндөр жигд.

---

## Review Focus

Artifact бол дизайны тодорхойлолт; тэр нь зөвхөн нэг багц демо өгөгдөл дээр ажилласан. Доорх тав нь бодит өгөгдөлтэй үед хүнд хоруулах магадлал хамгийн өндөр, дарааллаар.

1. **Мэдээ 0 эсвэл 1 ширхэг.** Тойрог нь `TOT = L*3`, `rel()` нь `% TOT` — `L = 0` бол тэгд хуваана, `L = 1` бол тавиур өөр дээрээ эргэлдэнэ. Хоосон бол тавиур огт зурагдахгүй, нэг бол зогсонги байх ёстой. → Task 3 (геометр), Task 4 (компонент).
2. **Хөдөлгөөн багасгах сонголт.** `prefers-reduced-motion` үед rAF-ийн давталт огт эхлэхгүй, номнууд уншигдах хэлбэрээр зогсох ёстой — artifact нь `RM` тугаар пүршийг алгасдаг, гэхдээ тайзны налалт, нээгдэх эргэлт нь үлддэг. → Task 4.
3. **Виджетийн өгөгдөл байхгүй.** `LiveState` мөр үүсээгүй, өнөөдрийн `Agenda` хоосон, идэвхтэй `TickerAd` байхгүй тохиолдол бүр хэвийн: виджет нуугдана эсвэл хоосон төлөв харуулна, 500 болохгүй. → Task 6 (query), Task 7 (виджет), Task 8 (стори).
4. **Утасны өргөн.** `--H` нь утсан дээр өөр (`min(70vw,40svh)`), `U` нь `H*1.05`. Тавиур хэвтээ гүйлт үүсгэхгүй, виджетүүд дүр зургийг дарахгүй. → Task 10.
5. **Гарчиг хэт урт / ангилалгүй мэдээ.** Нурууны `plate`, `b`, `em` нь тогтмол өргөнтэй; 200 тэмдэгтийн гарчиг эсвэл `categoryName` нь «Мэдээ» байх үед нуруу халихгүй. → Task 4.

---

## Файлын бүтэц

```
apps/parliament-news/
  app/
    artifact.css              artifact-ийн CSS бүтнээр (эх сурвалж, гараар засахгүй)
    globals.css               ЗАСНА: artifact.css-ийг Tailwind-ийн ДАРАА импортлоно
    page.tsx                  ЗАСНА: hero дүр зураг + доорх жагсаалт
  components/hero/
    hero.tsx                  дүр зургийн бүрхүүл (grain, city, floor, plat, probe)
    site-top.tsx              ЗАСНА→ artifact-ийн header.top + nav
    ticker.tsx                ШУУД-ын гүйдэг мөр
    widget-attendance.tsx     зүүн виджет: ирц, хуралдааны төлөв
    widget-agenda.tsx         баруун виджет: өнөөдрийн хуваарь
    stories-rail.tsx          стори зурвас
    shelf3d.tsx               3D тавиур (client, rAF)
    shelf-caption.tsx         доорх гарчиг/товч/огноо
    timeline.tsx              доод талын сарын шугам
    story-viewer.tsx          сторины бүтэн дэлгэцийн давхарга
  components/
    home-feed.tsx             hero-гийн доорх feed (artifact-ийн бүтцээр)
  lib/
    shelf-geometry.ts         ЦЭВЭР: measure/B/F/sm/rel/xsc/bookTransform
    shelf-geometry.test.ts
    home-data.ts              нүүрний бүх уншилт нэг дуудлагаар
    home-data.db.test.ts
    timeline.ts               оны хувь (цагийн шугам), цэвэр
    story-nav.ts              сторины шилжилт, цэвэр
  public/artifact/            city.svg, flag.svg, flag.jpg, logo.png,
                              logo-white.png, thumb.jpg
packages/db-news/prisma/
  seed-demo.ts                ЗАСНА: live, agenda, ticker, story, bill демо
```

**Шийдвэр:** `lib/shelf-geometry.ts` нь `shelf3d.tsx`-ээс тусдаа — тавиурын бүх тоон логик тэнд цэвэр функц болж тесттэй болно, компонент нь зөвхөн rAF ба DOM. Репод React рендерлэх тест байхгүй тул энэ л тестлэх цорын ганц зам.

---

## Task 1: Artifact-ийн CSS ба зураг файлуудыг зөөх

Дизайны суурь. Энэ даалгавар нэг ч компонент бичихгүй — зөвхөн эх сурвалжийг нь байрлуулж, Next build түүнийг зөв уншиж байгааг батална.

**Files:**
- Create: `apps/parliament-news/app/artifact.css`
- Create: `apps/parliament-news/public/artifact/` (6 файл)
- Modify: `apps/parliament-news/app/globals.css`
- Create: `apps/parliament-news/scripts/extract-artifact-css.mjs`

**Interfaces:**
- Consumes: `site-v2/index.html`.
- Produces: `artifact.css` дэх 959 дүрэм; `/artifact/<нэр>` замаар зурагнууд.

- [ ] **Step 1: Скриптээр CSS-ийг гаргах**

`scripts/extract-artifact-css.mjs` нь `site-v2/index.html`-ийн ганц `<style>` блокийг уншиж, дээр нь «ГАРААР ЗАСАХГҮЙ, эх сурвалж нь site-v2/index.html, дахин гаргах: node scripts/extract-artifact-css.mjs» гэсэн тайлбар тавьж `app/artifact.css` бичнэ. Гараар хуулахгүй: дахин гаргах боломжтой байх нь artifact шинэчлэгдэх үед чухал.

- [ ] **Step 2: Ажиллуулж, хэмжээг шалгах**

Run: `cd apps/parliament-news && node scripts/extract-artifact-css.mjs && wc -c app/artifact.css`
Expected: 78000–79000 байт. Дүрмийн тоо: `grep -o '{' app/artifact.css | wc -l` → 959.

- [ ] **Step 3: Зургуудыг хуулах**

```bash
mkdir -p apps/parliament-news/public/artifact
cp apps/parliament-news/site-v2/{city.svg,flag.svg,logo.png,logo-white.png,thumb.jpg} apps/parliament-news/public/artifact/
cp apps/parliament-news/site-v2/img/flag.jpg apps/parliament-news/public/artifact/
```

`artifact.css` доторх `url(...)` замууд нь artifact-ийн харьцангуй зам (`city.svg`) байх тул скрипт тэднийг `/artifact/city.svg` болгож солино. Скриптэд энэ орлуулалтыг оруул; Step 2-ын дараа `grep -c 'url(/artifact/' app/artifact.css` нь 0-ээс их байхыг шалга.

- [ ] **Step 4: `globals.css`-д импортлох**

`@import "./artifact.css";` нь ФАЙЛЫН ТӨГСГӨЛД — Tailwind-ийн `@tailwind utilities`-ийн дараа. Зөрчилдвөл artifact ялах ёстой.

CSS-ийн `@import` нь бусад дүрмээс өмнө байх ёстой гэсэн дүрэм PostCSS-ийн `postcss-import`-д хамаарахгүй (build үед inline болно). Хэрэв build анхааруулга өгвөл `app/layout.tsx`-д `import "./artifact.css"` гэж `globals.css`-ийн ДАРАА бичих хувилбарт шилж, шалтгааныг ledger-т бич.

- [ ] **Step 5: Build ногоон, токен зөрчилдөөгүйг батлах**

Run: `cd apps/parliament-news && pnpm build`
Expected: PASS.

Дараа нь production сервер дээр:
```bash
curl -s localhost:3005/ | grep -o 'artifact' | head -1
curl -s localhost:3005/_next/static/css/*.css 2>/dev/null | head -c 0  # зөвхөн зам
```
Нүдээр: `/` нь ӨМНӨХ ХЭВЭЭР ажиллаж байна — энэ алхамд харагдац өөрчлөгдөх ёстой боловч эвдрэх ёсгүй. Хэрэв 2-р шатны толгой/хөл танигдахгүй болсон бол artifact-ийн `body`, `a`, `h1` зэрэг өргөн сонгогчид Tailwind-ийн preflight-ийг дарсан байна — Task 2-т толгойг artifact-ийн бүтцээр солих тул энэ нь хүлээгдсэн. Эвдэрсэн зүйлийг бич, Task 2-т засна.

- [ ] **Step 6: Commit**

```bash
git add apps/parliament-news/app/artifact.css apps/parliament-news/app/globals.css \
        apps/parliament-news/public/artifact apps/parliament-news/scripts
git commit -m "feat(news): bring the artifact stylesheet and assets into the app"
```

---

## Task 2: Hero дүр зургийн бүрхүүл ба толгой

Artifact-ийн `div.hero` дотор: `grain`, `header.top`, `nav#nav2`, `div.cityw > div.city`, `div.plat`, `div.floor`, `#probe`. Энэ даалгавар тэднийг **өгөгдөлгүй**, статик бүтцээр барина — тавиур Task 4-т орно.

**Files:**
- Create: `apps/parliament-news/components/hero/hero.tsx`
- Modify: `apps/parliament-news/components/site-header.tsx`
- Modify: `apps/parliament-news/app/page.tsx`
- Modify: `apps/parliament-news/app/layout.tsx`

**Interfaces:**
- Consumes: `headerModel` (`components/site-chrome.ts`), `menuCategories` (`lib/posts.ts`).
- Produces: `<Hero>{children}</Hero>` — `children` нь тавиур ба түүн дээрх давхаргууд.

- [ ] **Step 1: `site-header.tsx`-ийг artifact-ийн бүтцээр солих**

Tailwind-ийн ангиллуудыг artifact-ийнхаар орлуулна: `header.top` > `a.brand.lbl` (лого `<img src="/artifact/logo.png">` + `<span>` + `em#btag.btag` нь домэйн) ба `nav.nav.lbl` > `span#navc.navc` (ангиллын холбоосууд) + `button#thm.thm` (цайвар/бараан) + `a#live.live` + `button#burger.burger` (хоёр `<i>`).

Цэсний агуулга нь ХЭВЭЭР `headerModel()`-ээс — зөвхөн markup солигдоно. `#thm` ба `#burger`-ийн зан төлөв Task 8-д; одоо товч нь байрлалд байна.

- [ ] **Step 2: `hero.tsx`**

`div.hero` > `div.grain`, `<SiteHeader/>`, `nav#nav2.nav2.lbl`, `div.cityw > div.city > div#cst.cst`, `div.plat`, `div.floor`, `div#probe` (`style="position:fixed;height:var(--H);width:1px;visibility:hidden"`), дараа нь `{children}`.

`#probe` нь ЗААВАЛ: Task 3-ийн `measure()` нь `--H`-ийн бодит px утгыг эндээс уншина.

- [ ] **Step 3: `page.tsx`-д hero-г оруулах**

Тавиурын оронд одоогоор `null`. Доорх «Онцлох», «Бүх мэдээ» хэсгүүд ХЭВЭЭР (2-р шатны `PostCard`) — тэднийг Task 8-д artifact-ийн feed-ээр солино.

- [ ] **Step 4: Нүдээр харьцуулах**

Production сервер өргөөд `localhost:3005/` ба `file:///.../site-v2/index.html` хоёрыг ижил өргөнд зураг авч харьцуул (headless Chrome, `--window-size=1280,900`).
Expected: толгой, nav2, хот/шал/тавцангийн дэвсгэр **байрлал, өнгө, хэмжээгээрээ тэнцүү**. Тавиур байхгүй нь хүлээгдсэн.

Зөрүү гарвал artifact-ийн CSS уншигдаагүй эсвэл ангиллын нэр буруу — DOM-ийг нь `site-v2/index.html`-тэй тулгаж шалга.

- [ ] **Step 5: Suite, lint, build**

Run: `cd apps/parliament-news && pnpm test && pnpm lint && pnpm build && cd ../web && pnpm build`
Expected: бүгд PASS. `components/site-chrome.test.ts`-ийн 11 тест ХЭВЭЭР ногоон байх ёстой — загвар өөрчлөгдөөгүй, зөвхөн markup.

- [ ] **Step 6: Commit**

```bash
git add apps/parliament-news/components/hero apps/parliament-news/components/site-header.tsx \
        apps/parliament-news/app/page.tsx apps/parliament-news/app/layout.tsx
git commit -m "feat(news): artifact hero scene and header markup"
```

---

## Task 3: Тавиурын геометр — цэвэр функцууд

Тавиурын бүх тоон логик энд, тесттэй. Компонент нь зөвхөн rAF ба DOM болно.

**Files:**
- Create: `apps/parliament-news/lib/shelf-geometry.ts`
- Create: `apps/parliament-news/lib/shelf-geometry.test.ts`

**Interfaces:**
- Consumes: юу ч үгүй.
- Produces:
  ```ts
  export const PERSPECTIVE = 1400;
  export type ShelfMetrics = {
    H: number; ws: number; d: number; gap: number; U: number; xs: number[];
  };
  export function metrics(probeHeight: number, viewportWidth: number): ShelfMetrics;
  export function smoothstep(x: number): number;
  export function bump(r: number): number;               // B(r)
  export function along(r: number, m: ShelfMetrics): number;   // F(r)
  export function relIndex(v: number, s: number, total: number): number;
  export function xOffset(u: number, m: ShelfMetrics): number; // xsc(u)
  export type BookPose = {
    x: number; y: number; z: number; rx: number; ry: number;
    zIndex: number; hidden: boolean;
    shadeSpine: number; shadeCover: number; shadeBack: number;
  };
  export function bookPose(input: {
    index: number; s: number; total: number; m: ShelfMetrics;
    lift: number; tiltX: number; tiltY: number;
  }): BookPose;
  export function springStep(s: number, target: number, dt: number, dragging: boolean): number;
  ```

- [ ] **Step 1: Write the failing tests** — `lib/shelf-geometry.test.ts`

```ts
const m = metrics(400, 1280); // H=400, дэлгэц

describe("metrics", () => {
  it("artifact-ийн харьцаанууд", () => {
    expect(m.H).toBe(400);
    expect(m.ws).toBeCloseTo(100, 6);   // H*0.25
    expect(m.d).toBeCloseTo(248, 6);    // H*0.62
    expect(m.gap).toBeCloseTo(14, 6);   // H*0.035
    expect(m.U).toBeCloseTo(520, 6);    // H*1.3 (дэлгэц)
  });
  it("утсан дээр U нь H*1.05", () => {
    expect(metrics(400, 600).U).toBeCloseTo(420, 6);
  });
  it("xs нь өсөн нэмэгдэх интеграл", () => {
    expect(m.xs[0]).toBe(0);
    for (let i = 1; i < m.xs.length; i++) expect(m.xs[i]).toBeGreaterThan(m.xs[i - 1]);
  });
  it("probe өндөр 0 байсан ч унахгүй", () => {
    const z = metrics(0, 1280);
    expect(Number.isFinite(z.U)).toBe(true);
    expect(z.xs.length).toBeGreaterThan(0);
  });
});

describe("smoothstep", () => {
  it("0, 1 дээр тогтвортой, дунд нь 0.5", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 6);
  });
});

describe("bump", () => {
  it("|r| >= 1 бол ±0.5", () => {
    expect(bump(1)).toBeCloseTo(0.5, 6);
    expect(bump(-3)).toBeCloseTo(-0.5, 6);
  });
  it("0 дээр 0, сондгой функц", () => {
    expect(bump(0)).toBeCloseTo(0, 6);
    expect(bump(0.4)).toBeCloseTo(-bump(-0.4), 6);
  });
});

describe("relIndex", () => {
  it("тойргийн хамгийн ойрын зайг өгнө", () => {
    expect(relIndex(0, 0, 12)).toBe(0);
    expect(relIndex(1, 0, 12)).toBe(1);
    expect(relIndex(11, 0, 12)).toBe(-1);   // 11 нь 12 тойрогт -1
  });
  it("бутархай байрлалд ажиллана", () => {
    expect(relIndex(0, 0.5, 12)).toBeCloseTo(-0.5, 6);
  });
  it("total 0 эсвэл 1 бол унахгүй", () => {
    expect(Number.isFinite(relIndex(0, 0, 0))).toBe(true);
    expect(Number.isFinite(relIndex(0, 0, 1))).toBe(true);
  });
});

describe("bookPose", () => {
  const base = { s: 0, total: 36, m, lift: 0, tiltX: 0, tiltY: 0 };

  it("идэвхтэй ном нь -90 градус эргэж хавтсаа харуулна", () => {
    expect(bookPose({ ...base, index: 0 }).ry).toBeCloseTo(-90, 1);
  });
  it("хөрш номнууд нуруугаараа үлдэнэ (эргэлт 26 градусын дотор)", () => {
    const p = bookPose({ ...base, index: 2 });
    expect(Math.abs(p.ry)).toBeLessThanOrEqual(26.001);
  });
  it("хол ном нуугдана", () => {
    expect(bookPose({ ...base, index: 8 }).hidden).toBe(true);
  });
  it("идэвхтэй ном хамгийн өндөр zIndex-тэй", () => {
    const a = bookPose({ ...base, index: 0 });
    const b = bookPose({ ...base, index: 3 });
    expect(a.zIndex).toBeGreaterThan(b.zIndex);
  });
  it("сүүдэр нь artifact-ийн хязгаарт", () => {
    const p = bookPose({ ...base, index: 1 });
    expect(p.shadeSpine).toBeLessThanOrEqual(0.6);
    expect(p.shadeCover).toBeGreaterThanOrEqual(0);
    expect(p.shadeBack).toBeCloseTo(0.5, 6);
  });
  it("бүх утга тоон, NaN байхгүй", () => {
    for (let i = 0; i < 12; i++) {
      const p = bookPose({ ...base, index: i });
      for (const v of [p.x, p.y, p.z, p.rx, p.ry]) expect(Number.isFinite(v)).toBe(true);
    }
  });
  it("нэг л ном байхад унахгүй", () => {
    const p = bookPose({ ...base, index: 0, total: 1 });
    expect(Number.isFinite(p.x)).toBe(true);
  });
});

describe("springStep", () => {
  it("зорилго руу ойртоно, давж гарахгүй", () => {
    const next = springStep(0, 10, 0.016, false);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });
  it("чирэх үед илүү хурдан", () => {
    expect(springStep(0, 10, 0.016, true)).toBeGreaterThan(springStep(0, 10, 0.016, false));
  });
  it("dt нь 0.05-аар хязгаарлагдана — таб руу буцахад үсрэхгүй", () => {
    expect(springStep(0, 10, 5, false)).toBeCloseTo(springStep(0, 10, 0.05, false), 6);
  });
  it("аль хэдийн зорилго дээр бол хөдлөхгүй", () => {
    expect(springStep(7, 7, 0.016, false)).toBeCloseTo(7, 6);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/shelf-geometry.test.ts`
Expected: FAIL — `metrics is not a function`

- [ ] **Step 3: Implement `lib/shelf-geometry.ts`**

Дээрх «Artifact-аас гаргасан тавиурын геометр» хэсгийн томьёог үг дуудлагаар хэрэглэ. `total <= 1` үед `relIndex` нь 0 буцаана (тэгд хуваахгүй). `probeHeight` нь 0 эсвэл тоо биш бол 1 гэж үзнэ — `metrics` хэзээ ч `NaN` агуулсан бүтэц буцаахгүй.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/shelf-geometry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/parliament-news/lib/shelf-geometry.ts apps/parliament-news/lib/shelf-geometry.test.ts
git commit -m "feat(news): shelf geometry as pure functions, ported from the artifact"
```

---

## Task 4: 3D тавиур — дөрвөн талтай ном, rAF давталт

**Files:**
- Create: `apps/parliament-news/components/hero/shelf3d.tsx` (`"use client"`)
- Delete: `apps/parliament-news/components/shelf.tsx`, `shelf.module.css`
- Modify: `apps/parliament-news/components/shelf-model.ts`
- Modify: `apps/parliament-news/components/shelf-model.test.ts`
- Modify: `apps/parliament-news/app/page.tsx`

**Interfaces:**
- Consumes: Task 3-ийн бүх export; `ShelfBook` (`components/shelf-model.ts`).
- Produces: `<Shelf3D books={ShelfBook[]} onActive={(i: number) => void} />`

`ShelfBook` нь дөрвөн талд хэрэгтэй талбаруудаар ӨРГӨЖНӨ (одоо байгаа дээр нэмэх):
`spineLabel`, `kicker`, `number`, `date` (аль хэдийн байгаа), + `lead` (ар тал), `coverUrl`, `bg`, `fg`, `light`, `href`, `title`.

- [ ] **Step 1: `shelf-model.test.ts`-д нуруунд хэрэгтэй утгуудыг тогтоох**

```ts
it("нурууны шошго нь ангилал, kicker нь мэдээний kicker", () => {
  const b = shelfBooks([post({ kicker: "ЧУУЛГАН", categoryName: "Төсөв" })])[0];
  expect(b.spineLabel).toBe("Төсөв");
  expect(b.kicker).toBe("ЧУУЛГАН");
});
it("нуруунд хэт урт гарчиг багтахаар тайрагдана", () => {
  const b = shelfBooks([post({ kicker: null, title: "Үг ".repeat(80).trim() })])[0];
  expect(b.kicker.length).toBeLessThanOrEqual(42);
});
it("ангилалгүй мэдээнд нурууны шошго «Мэдээ»", () => {
  expect(shelfBooks([post({ categoryName: "Мэдээ" })])[0].spineLabel).toBe("Мэдээ");
});
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `cd apps/parliament-news && pnpm exec vitest run components/shelf-model.test.ts`
Expected: FAIL — тайралтын тест унана

- [ ] **Step 3: `shelf-model.ts`-ийг зас**

`kicker` нь 42 тэмдэгтээс хэтрэвэл үгийн зааг дээр тайрна (`excerpt`-ийг дахин хэрэглэ).

- [ ] **Step 4: Run to verify they pass**

Run: `cd apps/parliament-news && pnpm exec vitest run components/shelf-model.test.ts`
Expected: PASS

- [ ] **Step 5: `shelf3d.tsx`-ийг хэрэгжүүлэх**

Бүтэц: `section#shelf.shelf > div#stage.stage > div.tape[]`, ном бүр дотроо дөрвөн `div.f` — `sp`, `cv`, `bk`, `fe`. Талуудын өргөн/байрлал/transform нь Global Constraints-ийн хүснэгтээр, JS-ээс `style`-аар тавигдана (CSS нь `ws`/`d`-г мэдэхгүй).

Нурууны агуулга artifact-ийнхаар: `<i class="gb"/>`, `<span class="plate"><s>МЭДЭЭ</s>{spineLabel}</span>`, `<b>{kicker}</b>`, `<em>{number}<br/>{date}</em>`, `<i class="gb"/>`.
Хавтас: `<img src={coverUrl}>` (2-р шатны кэшлэгдэх зам).
Ар: `<div class="bkt"><small>ТОВЧ АГУУЛГА</small><p>{lead}</p><i/></div>`.

rAF давталт: `metrics()`-ийг `#probe`-оос хэмжиж `ResizeObserver`-оор шинэчилнэ; кадр бүрт `springStep` → ном бүрт `bookPose` → `style.transform`, `zIndex`, `--shade`. Идэвхтэй индекс солигдоход `onActive` дуудна.

Оролт: чирэлт (`pointerdown/move/up`), `wheel` (хэвтээ), `←`/`→`, `Enter`. Ном бүр `<a href>`-тэй — **анимаци ажиллахгүй байсан ч холбоос ажиллана**.

`button#play.play` — идэвхтэй мэдээ видеотой үед (ангилал нь `video` эсвэл
`media`-д `kind="video"` байх) хавтасны төв дээр гарна, дарвал мэдээ рүү очно.
Видеогүй үед зурагдахгүй.

**Review Focus #1:** `books.length === 0` бол компонент `null` буцаана; `=== 1` бол rAF эхлэхгүй, ганц ном төвд зогсоно.
**Review Focus #2:** `prefers-reduced-motion` үед rAF огт эхлэхгүй — `s = T` шууд, `tiltX = tiltY = 0`, нэг удаа байрлуулаад зогсоно.

- [ ] **Step 6: Хуучин тавиурыг устгах**

`components/shelf.tsx`, `components/shelf.module.css` устгана; `page.tsx` нь `<Shelf3D>`-г hero дотор оруулна.

- [ ] **Step 7: Нүдээр харьцуулах — энэ бол хаалга**

Хоёр хуудсыг ижил өргөнд зураг аваад тулга:
```bash
chrome --headless --window-size=1280,900 --screenshot=ours.png http://127.0.0.1:3005/
chrome --headless --window-size=1280,900 --screenshot=artifact.png "file:///.../site-v2/index.html"
```
Expected: номнууд **нуруугаараа зогсож**, идэвхтэй нь эргэж хавтсаа харуулж, зузаан нь харагдаж, хуудасны ирмэг нь судалтай. Хоёрын хооронд номын хэмжээ, зай, перспектив мэдэгдэхүйц ялгаатай бол геометрийн утга буруу — Task 3-ийн томьёог дахин тулга.

- [ ] **Step 8: Suite, lint, build**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build && cd ../web && pnpm build`
Expected: бүгд PASS

- [ ] **Step 9: Commit**

```bash
git add apps/parliament-news/components apps/parliament-news/app/page.tsx
git rm apps/parliament-news/components/shelf.tsx apps/parliament-news/components/shelf.module.css
git commit -m "feat(news): real 3D bookshelf — four-face volumes, spine out, cover opens"
```

---

## Task 5: Гарчгийн блок ба цагийн шугам

**Files:**
- Create: `apps/parliament-news/components/hero/shelf-caption.tsx` (`"use client"`)
- Create: `apps/parliament-news/components/hero/timeline.tsx`
- Create: `apps/parliament-news/lib/timeline.ts`
- Create: `apps/parliament-news/lib/timeline.test.ts`

**Interfaces:**
- Consumes: `ShelfBook` (Task 4), `mnDate` (`lib/format.ts`).
- Produces:
  - `yearFraction(d: Date): number` — оны хэдэн хувь өнгөрсөн (0..1)
  - `<ShelfCaption books={ShelfBook[]} active={number} />`
  - `<Timeline marks={{ fraction: number }[]} active={number} />`

- [ ] **Step 1: Write the failing tests** — `lib/timeline.test.ts`

```ts
describe("yearFraction", () => {
  it("1-р сарын 1 нь 0 орчим", () => {
    expect(yearFraction(new Date("2026-01-01T00:00:00Z"))).toBeCloseTo(0, 2);
  });
  it("12-р сарын 31 нь 1 орчим", () => {
    expect(yearFraction(new Date("2026-12-31T00:00:00Z"))).toBeCloseTo(1, 2);
  });
  it("оны дунд нь 0.5 орчим", () => {
    expect(yearFraction(new Date("2026-07-02T00:00:00Z"))).toBeCloseTo(0.5, 2);
  });
  it("өндөр жилд ч 0..1 хооронд", () => {
    expect(yearFraction(new Date("2028-02-29T00:00:00Z"))).toBeGreaterThan(0);
    expect(yearFraction(new Date("2028-02-29T00:00:00Z"))).toBeLessThan(1);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/timeline.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `lib/timeline.ts`**

Огноог UTC-ээр уншина (`@db.Date` нь бүсгүй).

- [ ] **Step 4: Run to verify they pass**

Expected: PASS

- [ ] **Step 5: Компонентууд**

`shelf-caption.tsx`: `div.cap > div#cT.m.ct`, `div#cS.m.cs`, `div#cL.m.cl`, `div#cY.m.cy`. Идэвхтэй ном солигдоход Web Animations API-гаар босоо гүйлгэх (artifact-ийн `swap()`: `translateY(±105%)`, 650 мс, `cubic-bezier(.2,.8,.2,1)`). `prefers-reduced-motion` үед анимацигүй шууд солино.

`timeline.tsx`: 52 долоо хоногийн зураас, 12 сарын шошго, мэдээ бүрт `div.ev`, идэвхтэй цэг. Серверийн компонент — зөвхөн идэвхтэй цэгийн байрлал client талаас ирнэ.

- [ ] **Step 6: Нүдээр шалгах**

Тавиурыг эргүүлэхэд гарчиг солигдож, цагийн шугамын цэг хөдөлж байгаа эсэх. `prefers-reduced-motion` үед гүйлгэхгүй шууд солигдоно.

- [ ] **Step 7: Suite, lint, build → Commit**

```bash
git add apps/parliament-news/components/hero apps/parliament-news/lib/timeline.ts apps/parliament-news/lib/timeline.test.ts
git commit -m "feat(news): shelf caption and year timeline"
```

---

## Task 6: Нүүрний өгөгдөл — нэг уншилт

Виджетүүд тус бүрдээ query дуудвал нүүр 6–7 удаа санд очно. Бүгдийг нэг дуудлагаар.

**Files:**
- Create: `apps/parliament-news/lib/home-data.ts`
- Create: `apps/parliament-news/lib/home-data.db.test.ts`
- Modify: `packages/db-news/prisma/seed-demo.ts`

**Interfaces:**
- Consumes: `requireTenant`, `forTenant`, `listPosts` (`lib/posts.ts`).
- Produces:
  ```ts
  export type HomeData = {
    latest: PostListItem[];
    featured: PostListItem[];
    stories: PostListItem[];          // story=true БА storyUntil > now
    live: { attendance: number; sessionStatus: string; tickerOn: boolean;
            liveOn: boolean; liveTitle: string | null; liveUrl: string | null;
            breakingOn: boolean; breakingText: string | null;
            breakingSlug: string | null } | null;
    agenda: { time: string; text: string }[];   // ӨНӨӨДРИЙН
    ticker: { text: string; url: string | null }[];
  };
  export function homeData(): Promise<HomeData>;
  ```

- [ ] **Step 1: Write the failing DB tests** — `lib/home-data.db.test.ts`

`beforeAll`-д жинхэнэ tenant дотор: `LiveState` (attendance 98, sessionStatus «Хуралдаж байна»), өнөөдрийн 3 `Agenda`, маргаашийн 1 `Agenda`, 2 идэвхтэй + 1 идэвхгүй `TickerAd`, `story: true` мэдээ (storyUntil ирээдүйд) ба хугацаа нь дууссан story. `afterAll`-д тэднийг устгана; tenant-ыг УСТГАХГҮЙ.

```ts
it("өнөөдрийн хуваарь л орно, маргаашийнх орохгүй", async () => {
  const { agenda } = await homeData();
  expect(agenda.map((a) => a.time)).toEqual(["10:00", "14:00", "16:30"]);
});
it("идэвхгүй ticker орохгүй", async () => {
  const { ticker } = await homeData();
  expect(ticker.every((t) => t.text !== "ИДЭВХГҮЙ")).toBe(true);
});
it("хугацаа нь дууссан стори орохгүй", async () => {
  const { stories } = await homeData();
  expect(stories.map((s) => s.slug)).not.toContain("story-expired");
});
it("ноорог стори ч орохгүй", async () => {
  const { stories } = await homeData();
  expect(stories.map((s) => s.slug)).not.toContain("demo-nooreg");
});
it("live мөр байхгүй бол null, унахгүй", async () => {
  // LiveState-ийг устгаад дахин уншина
  const { live } = await homeData();
  expect(live === null || typeof live.attendance === "number").toBe(true);
});
```

**Review Focus #3:** сүүлийн тест нь виджетийн өгөгдөл байхгүй үеийг барина.

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/home-data.db.test.ts`
Expected: FAIL — модуль байхгүй

- [ ] **Step 3: Implement `lib/home-data.ts`**

Нэг `Promise.all`. Бүх уншилт `forTenant`-аар. Стори нь нийтийн хаалгын нөхцөл + `story: true` + `storyUntil: { gt: now }`. Хуваарь нь `date` = өнөөдөр (UTC), `orderBy: order`. Ticker нь `active: true`, `orderBy: order`.

- [ ] **Step 4: Run to verify they pass**

Expected: PASS

- [ ] **Step 5: Демо өгөгдөл нэмэх**

`seed-demo.ts`-д: `LiveState` (attendance 98, «Хуралдаж байна», tickerOn), өнөөдрийн 3 `Agenda` (artifact-ийнхтай ижил: 10:00 «Нэгдсэн хуралдаан — төсвийн гүйцэтгэлийн тайлан», 14:00 «Эдийн засгийн байнгын хороо», 16:30 «Ажлын хэсэг — сонгуулийн хууль»), 4 `TickerAd`, 2 мэдээнд `story: true`, 1 `Bill` 5 шаттай.

Run: `cd packages/db-news && pnpm db:seed:demo`
Expected: дүгнэлтэд live, agenda, ticker, story-ийн тоо гарна.

- [ ] **Step 6: Suite, lint → Commit**

```bash
git add apps/parliament-news/lib/home-data.ts apps/parliament-news/lib/home-data.db.test.ts \
        packages/db-news/prisma/seed-demo.ts
git commit -m "feat(news): one read for the whole home page, plus module demo data"
```

---

## Task 7: Виджетүүд — ирц, хуваарь, ШУУД, стори

**Files:**
- Create: `apps/parliament-news/components/hero/ticker.tsx`
- Create: `apps/parliament-news/components/hero/widget-attendance.tsx`
- Create: `apps/parliament-news/components/hero/widget-agenda.tsx`
- Create: `apps/parliament-news/components/hero/stories-rail.tsx`
- Modify: `apps/parliament-news/components/hero/hero.tsx`
- Modify: `apps/parliament-news/app/page.tsx`

**Interfaces:**
- Consumes: `HomeData` (Task 6).
- Produces: дөрвөн server component, бүгд `HomeData`-ийн хэсгийг prop-оор авна.

- [ ] **Step 1: Компонентууд**

`ticker.tsx` → `div.tick > b.lbl` («ШУУД») `+ div.tw > div#tr.tr` (гүйдэг элементүүд) `+ div#tinfo.tinfo`. `live.tickerOn` худал эсвэл `ticker` хоосон бол **юу ч зурахгүй** (`null`).

`widget-attendance.tsx` → `aside.wg.wl > div.lbl.wk` («УИХ · Нэгдсэн хуралдаан») `+ div.big > span#att` (ирц) `+ small` («/126 ирц») `+ div#sst.lbl.on` (хуралдааны төлөв). `live === null` бол `null`.

`widget-agenda.tsx` → `aside.wg.wr > div.lbl.wk` («Өнөөдөр хэлэлцэх асуудал») `+ ol#ag.ag > li > time + span` `+ div#smp.smp` («Жишээ өгөгдөл» — зөвхөн демо үед). `agenda` хоосон бол `null`.

`stories-rail.tsx` → `nav#stories.stories` > стори бүрт дугуй зураг + нэр. `stories` хоосон бол `null`.
Стори дарахад одоогоор мэдээ рүү очно; бүтэн дэлгэцийн үзүүлэгч нь Task 8.

`div#mstat.mstat.lbl` — утсан дээр хуралдааны төлөв ба ирцийг нэг мөрөнд
харуулах зурвас (`wg` виджетүүд нарийн дэлгэцэд нуугддаг). Agenda/attendance-тай
ижил өгөгдлөөс; `live === null` бол `null`. `hero.tsx`-д байрлана.

**Review Focus #3:** дөрвүүлэн хоосон өгөгдөлд `null` буцаана, 500 болохгүй.

- [ ] **Step 2: `hero.tsx`, `page.tsx`-д холбох**

`page.tsx` нь `homeData()`-г НЭГ удаа дуудаж, хэсгүүдийг компонентуудад тараана.

- [ ] **Step 3: Хоосон өгөгдлийн шалгалт**

```bash
docker exec parlamentnews-pg psql -U parlament -d parlamentnews -c "delete from pn_live;"
docker exec parlamentnews-pg psql -U parlament -d parlamentnews -c "delete from pn_agenda;"
docker exec parlamentnews-pg psql -U parlament -d parlamentnews -c "update pn_ticker_ads set active=false;"
curl -s -o /dev/null -w '%{http_code}\n' localhost:3005/
```
Expected: **200**. Дараа нь `pnpm db:seed:demo`-оор буцааж сэргээнэ.

- [ ] **Step 4: Нүдээр харьцуулах**

Artifact-тай зэрэгцүүлж зураг ав: ирцийн виджет зүүн, хуваарь баруун, ШУУД дээр, стори зүүн дээд.

- [ ] **Step 5: Suite, lint, build → Commit**

```bash
git add apps/parliament-news/components/hero apps/parliament-news/app/page.tsx
git commit -m "feat(news): attendance, agenda, ticker and stories from real data"
```

---

## Task 8: Сторины бүтэн дэлгэцийн үзүүлэгч

Artifact-ийн `div#sv.sv` — дарсан сторийг бүтэн дэлгэцээр үзүүлж, зүүн/баруун
сумаар дараагийнх руу шилждэг давхарга.

**Files:**
- Create: `apps/parliament-news/components/hero/story-viewer.tsx` (`"use client"`)
- Create: `apps/parliament-news/lib/story-nav.ts`
- Create: `apps/parliament-news/lib/story-nav.test.ts`
- Modify: `apps/parliament-news/components/hero/stories-rail.tsx`

**Interfaces:**
- Consumes: `HomeData["stories"]` (Task 6).
- Produces:
  - `nextStory(current: number, total: number, dir: 1 | -1): number | null`
  - `<StoryViewer stories={PostListItem[]} />` — нээх/хаахыг өөрөө удирдана

- [ ] **Step 1: Write the failing tests** — `lib/story-nav.ts`

```ts
describe("nextStory", () => {
  it("дараагийнх руу шилжинэ", () => {
    expect(nextStory(0, 3, 1)).toBe(1);
  });
  it("эцсийнхээс цааш явахгүй — null (хаана гэсэн дохио)", () => {
    expect(nextStory(2, 3, 1)).toBeNull();
  });
  it("эхнийхээс өмнө явахгүй", () => {
    expect(nextStory(0, 3, -1)).toBeNull();
  });
  it("нэг л стори байхад хоёр тал null", () => {
    expect(nextStory(0, 1, 1)).toBeNull();
    expect(nextStory(0, 1, -1)).toBeNull();
  });
  it("стори байхгүй үед null", () => {
    expect(nextStory(0, 0, 1)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/parliament-news && pnpm exec vitest run lib/story-nav.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `lib/story-nav.ts`**

- [ ] **Step 4: Run to verify they pass** — Expected: PASS

- [ ] **Step 5: `story-viewer.tsx`**

Бүтэц artifact-ийнхаар: `div#sv.sv > div#svb.svb` дотор `div#svp.svp` (явцын зураас),
`div.svh > span#svd + button#svx` (хаах), `div#svm.svm` (зураг),
`div.svt > span#svc + h2#svT + p#svL + button#svgo.svgo` («Мэдээг унших»),
`button#svl.svz.l` ба `button#svr.svz.r` (сум).

`Escape` нь хаана, `←`/`→` нь шилжинэ, `button#svgo` нь `/news/<slug>` руу очно.
Нээлттэй үед `<body>`-гийн гүйлтийг түгжинэ, хаахад буцаана. Фокусыг давхарга
дотор барина (`svx` дээр эхэлнэ) — гараар хаах боломжгүй давхарга бол урхи.

**Review Focus #3:** стори байхгүй бол `stories-rail` өөрөө `null` буцаадаг тул
үзүүлэгч хэзээ ч нээгдэхгүй; гэсэн ч `stories.length === 0` үед компонент
`null` буцаана.

- [ ] **Step 6: Нүдээр шалгах**

Стори дарж нээгдэх, сумаар шилжих, `Escape`-ээр хаагдах, «Мэдээг унших» нь
зөв хаяг руу очихыг шалга. `prefers-reduced-motion` үед шилжилт анимацигүй.

- [ ] **Step 7: Suite, lint, build → Commit**

```bash
git add apps/parliament-news/components/hero/story-viewer.tsx \
        apps/parliament-news/components/hero/stories-rail.tsx \
        apps/parliament-news/lib/story-nav.ts apps/parliament-news/lib/story-nav.test.ts
git commit -m "feat(news): full-screen story viewer"
```

---

## Task 9: Нүүрний доод хэсэг — feed ба хөл

Hero-гийн доорх жагсаалт одоо 2-р шатны Tailwind карт. Artifact-д тэр нь
`main.feed > section#today + section.fsec + aside.fside`, хөл нь `footer.foot`
ба `#sfoot`. Энэ даалгавар тэднийг artifact-ийн бүтцээр солино.

**Files:**
- Create: `apps/parliament-news/components/home-feed.tsx`
- Modify: `apps/parliament-news/components/site-footer.tsx`
- Modify: `apps/parliament-news/app/page.tsx`

**Interfaces:**
- Consumes: `HomeData` (Task 6), `footerModel` (`components/site-chrome.ts`).
- Produces: `<HomeFeed data={HomeData} />`

- [ ] **Step 1: `home-feed.tsx`**

`main.feed` > `section#today.today` («Өнөөдөр» — сүүлийн мэдээ цагийн дарааллаар),
`section.fsec` (ангиллын блокууд), `aside.fside` (их уншсан, сурталчилгааны байр).
Artifact-ийн ангиллын нэрс, бүтэц хэвээр; өгөгдөл нь `HomeData.latest`,
`HomeData.featured`-ээс.

«БҮХ МЭДЭЭ ↓» товч нь feed рүү гүйлгэнэ (artifact-ийнхтай ижил).

- [ ] **Step 2: Хөлийг artifact-ийн бүтцээр**

`site-footer.tsx` нь `footer.foot` ба `nav.sfn`-ийн ангиллуудыг хэрэглэнэ.
`footerModel()`-ийн гаралт ХЭВЭЭР — зөвхөн markup солигдоно, тиймээс
`components/site-chrome.test.ts`-ийн 11 тест ногоон үлдэх ёстой.

- [ ] **Step 3: 2-р шатны картуудыг хаана үлдээхээ шийдэх**

`PostCard` нь ангилал, таг, хайлтын хуудсанд ХЭВЭЭР хэрэглэгдэнэ — тэд энэ
төлөвлөгөөний хүрээнд биш. Зөвхөн нүүрнээс хасагдана.

- [ ] **Step 4: Нүдээр харьцуулах**

Нүүрийг доош гүйлгээд artifact-тай тулга: feed-ийн багана, ангиллын блок,
хөлийн байрлал.

- [ ] **Step 5: Suite, lint, build → Commit**

```bash
git add apps/parliament-news/components apps/parliament-news/app/page.tsx
git commit -m "feat(news): artifact feed and footer on the home page"
```

---

## Task 10: Эцсийн тулгалт — утас, бараан горим, хөдөлгөөн багасгах

Энэ даалгавар шинэ боломж нэмэхгүй. Artifact-тай зөрөхийг олж засна.

**Files:**
- Modify: ямар ч компонент, зөрүүгээс хамаарч
- Modify: `apps/parliament-news/README.md`

- [ ] **Step 1: Дөрвөн нөхцөлд зураг авч тулгах**

| Нөхцөл | Команд |
|---|---|
| Дэлгэц, цайвар | `--window-size=1280,900 --blink-settings=preferredColorScheme=1` |
| Дэлгэц, бараан | `--window-size=1280,900 --blink-settings=preferredColorScheme=0` |
| Утас (390px iframe) | iframe-ээр хэмжинэ — бие даасан `--window-size=390` нь найдваргүй |
| Хөдөлгөөн багасгах | `--force-prefers-reduced-motion` |

Хоёр хуудас бүрт: `localhost:3005/` ба `file:///.../site-v2/index.html`.

- [ ] **Step 2: Утсан дээр хэвтээ халилтгүйг ХЭМЖИХ**

iframe дотор `document.documentElement.scrollWidth` ба `clientWidth`-ийг уншина.
Expected: хоёулаа 390. Бие даасан screenshot-д найдахгүй — 2-р шатанд тэр нь байхгүй халилт харуулсан.

**Review Focus #4.**

- [ ] **Step 3: `#thm` (цайвар/бараан) ба `#burger` товчийг ажиллуулах**

`#thm` нь `document.documentElement`-ийн `data-theme`-ийг сольж `localStorage`-д санана (`try/catch` — хувийн цонхонд шидэж болно). `#burger` нь `#menu`-г нээнэ; цэсний агуулга нь ангиллууд ба хайлтын холбоос.

- [ ] **Step 4: Клавиатур ба дэлгэц уншигч**

Tab-аар тавиурт хүрч `←`/`→`-ээр эргүүлж, `Enter`-ээр мэдээ нээгдэхийг шалга. Ном бүрийн холбоост мэдээний гарчиг `sr-only`-оор байх ёстой.

**Review Focus #5.**

- [ ] **Step 5: README-д нүүрний бүтцийг тэмдэглэх**

Виджет бүр ямар хүснэгтээс тэжээгддэгийг хүснэгтээр — редакц юуг хаанаас өөрчлөхийг мэдэх ёстой.

- [ ] **Step 6: Бүх шалгалт**

Run: `cd apps/parliament-news && pnpm test && pnpm test:db && pnpm lint && pnpm build && cd ../web && pnpm build`
Expected: бүгд PASS

- [ ] **Step 7: Commit**

```bash
git add apps/parliament-news
git commit -m "feat(news): home page matches the artifact across themes, widths and reduced motion"
```

---

## Дууссаны дараа

Бүтэн branch-ийн хяналт (`superpowers:requesting-code-review`, шинэ контекст, хамгийн чадварлаг модель), дараа нь `superpowers:finishing-a-development-branch`.

**Энэ төлөвлөгөөнд ОРООГҮЙ, дараагийн ажил:**
- Нийтлэлийн хуудас (`detail`), цэс, хайлтын давхарга, lightbox — artifact-д байгаа, 2-р шатанд Tailwind-аар бичигдсэн
- Хуулийн төслийн 5 шатны дүрслэл (`Bill`/`BillStage` схемд бэлэн)
- Баннер, ханш (`Banner`, `FxRate`)
- Шууд дамжуулалт (`LiveState.liveOn/liveUrl`)
- Редакцын систем бүхэлдээ (3-р шат)
