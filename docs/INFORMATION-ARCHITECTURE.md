# Nuul Digital — Information Architecture

> Implementation-ready IA, mapped to the live Next.js routes. Status legend:
> ✅ built · ◐ partial (copy/asset pending) · ☐ recommended next.

---

## 1. Sitemap

```
/                                   ✅ Home
/about                              ✅ About
/services                           ✅ Services (index)
  /services/web-development         ✅
  /services/ai-chatbots             ✅
  /services/automation              ✅
  /services/mobile-apps             ✅
  /services/branding                ✅
  /services/cloud-infrastructure    ✅
  /services/digital-marketing       ✅
  /services/ui-ux-design            ✅ (9th pillar)
  /services/ecommerce               ✅ (9th pillar)
/industries                         ✅ Industries (index)
  /industries/[finance | retail-ecommerce | healthcare |
   education | logistics | government | startups]   ✅
/portfolio                          ✅ Portfolio (filterable)
  /portfolio/[slug]                 ✅ Project detail
/case-studies                       ✅ Case Studies (index)
  /case-studies/[slug]              ✅ Case study detail
/blog                               ✅ Blog (search + categories + tags)
  /blog/[slug]                      ✅ Article
/careers                            ✅ Careers
  /careers/[slug]                   ✅ Role detail + apply
/contact                            ✅ Contact (Message + Meeting tabs)
/quote                              ✅ Multi-step quote wizard
/legal/privacy · /legal/terms       ✅
/admin/*                            ✅ CMS (noindex, guarded)
sitemap.xml · robots.txt · manifest · opengraph-image · icon   ✅
```

**Global nav:** Нүүр · Бидний тухай · Үйлчилгээ · Салбарууд · Портфолио · Кейс судалгаа · Блог · Ажлын байр · Холбоо барих · `[Үнийн санал авах →]` (persistent CTA).
**Footer:** Компани / Үйлчилгээ / Нөөц columns + contact block + newsletter + socials + legal.

---

## 2. Home Page Structure

10 sections, ordered as a conversion funnel: **promise → proof → capability → trust → action.**

### § Hero ✅
- **Goal:** State the transformation promise in 3 seconds; drive to quote or portfolio.
- **Headline:** *Бид Монголын дижитал ирээдүйг бүтээдэг*
- **Subheadline:** Вэб, AI, автоматжуулалт болон дижитал шийдлээр таны бизнесийг дараагийн түвшинд хүргэнэ. Дэлхийн жишигт нийцсэн чанар, Монголын зах зээлд.
- **Content blocks:** eyebrow chip ("Монголын дижитал шилжилтийн түнш") · animated word-by-word headline · 4-stat strip (120+ төсөл · 50+ түнш · 8 жил · 98% ханамж) · scroll cue.
- **CTA:** Primary `Төслөө эхлүүлэх →` (/quote) · Secondary `Бүтээлүүдийг үзэх` (/portfolio).

### § Trusted By ✅
- **Goal:** Instant credibility via social proof.
- **Headline:** *50+ тэргүүлэгч байгууллага биднийг сонгосон*
- **Content:** auto-scrolling client logo marquee (grayscale → color on hover).
- **CTA:** none (passive trust).

### § Services ✅
- **Goal:** Show breadth of capability; route to service detail.
- **Headline:** *Бүрэн цогц дижитал шийдэл*
- **Subheadline:** Санаанаас эхлээд нэвтрүүлэлт хүртэл — таны бизнест хэрэгтэй бүх дижитал чадварыг нэг дороос.
- **Content:** bento grid of 9 services (AI & Web featured, 2-span), icon + 1-liner, hover glow.
- **CTA:** per-tile `→` to `/services/[slug]`.

### § Why Nuul ✅
- **Goal:** Differentiate; convert browser → believer.
- **Headline:** *Зүгээр л агентлаг биш, өсөлтийн түнш*
- **Subheadline:** Бид төсөл хүлээлгэн өгөөд орхидоггүй...
- **Content:** sticky statement + animated stat counters + 4 differentiators (Quality, Outcome-driven, Transparent partnership, Continuous improvement).
- **CTA:** implicit (scroll).

### § Portfolio Showcase ✅
- **Goal:** Prove results with real work.
- **Headline:** *Үр дүнгээр ярьдаг төслүүд*
- **Content:** 3 featured projects, parallax imagery, result metrics, industry/year badges.
- **CTA:** `Бүх ажил →` (/portfolio) + per-card → detail.

### § AI & Automation ✅
- **Goal:** Own the AI-forward positioning.
- **Headline:** *Хиймэл оюун ухааныг бизнестээ нэвтрүүл*
- **Subheadline:** Давтагдах ажлыг автоматжуулж, харилцагчдад 24/7 шуурхай үйлчилгээ...
- **Content:** capability grid (Mongolian LLM, 24/7 bot, process automation, real-time integration) + animated chat mock.
- **CTA:** `AI шийдэл судлах →` (/services/ai-chatbots).

### § Testimonials ✅
- **Goal:** Peer validation.
- **Headline:** *Үйлчлүүлэгчид биднийг сонгосон шалтгаан*
- **Content:** carousel — quote, 5-star, avatar, name/role/company.
- **CTA:** none.

### § Process ✅
- **Goal:** Reduce risk by showing a clear method.
- **Headline:** *Санаанаас үр дүн хүртэл*
- **Subheadline:** Тодорхой, ил тод, баталгаажсан 5 алхамт үйл явц...
- **Content:** 5-step stepper (Судалгаа → Дизайн → Хөгжүүлэлт → Нэвтрүүлэлт → Өсөлт).
- **CTA:** implicit.

### § FAQ ☐ (recommended add to home; component exists)
- **Goal:** Remove final objections (timeline, price, ownership, support).
- **Headline:** *Түгээмэл асуултууд*
- **Content:** accordion — "Хэр удах вэ?", "Үнэ хэрхэн тогтох вэ?", "Эх код хэнийх вэ?", "Дараа дэмжлэг үзүүлэх үү?".
- **CTA:** `Дэлгэрэнгүй асуух` (/contact).

### § CTA Block ✅
- **Goal:** Convert at peak intent.
- **Headline:** *Төслөө эхлүүлэхэд бэлэн үү?*
- **Subheadline:** Үнэ төлбөргүй зөвлөгөө аваарай...
- **CTA:** `Үнийн санал авах →` (/quote) + `Холбоо барих` (/contact).

### § Contact ✅
- **Goal:** Capture leads who scrolled the whole page.
- **Headline:** *Ярилцъя. Санаагаа хуваалцаарай.*
- **Content:** contact detail cards + tabbed form (Зурвас / Уулзалт захиалах).
- **CTA:** `Зурвас илгээх` / `Уулзалт захиалах`.

---

## 3. Services Structure

**Index** (`/services`) — bento/grid of all pillars → process → CTA.
**Detail template** (`/services/[slug]`) — every page shares this structure:
`PageHeader (label + title + intro)` → **Бид юу хийдэг вэ** (features grid) → **Хүлээлгэн өгөх үр дүн** (deliverables) → sticky CTA card (quote + contact) → **Бусад үйлчилгээ** (cross-sell 3) → CTA band.

| Service | Route | Positioning one-liner |
|---|---|---|
| Website Development | `/services/web-development` | Хурдан, аюулгүй, өргөтгөх боломжтой вэб платформ. |
| AI Chatbots | `/services/ai-chatbots` | 24/7 ажиллах ухаалаг харилцагчийн туслах. |
| Business Automation | `/services/automation` | Давтагдах ажлыг автоматжуулж цаг хэмнэнэ. |
| Mobile Apps | `/services/mobile-apps` | iOS ба Android-д зориулсан нэгдсэн апп. |
| Branding | `/services/branding` | Танигдахуйц, тогтвортой брэнд таних тэмдэг. |
| Cloud Infrastructure | `/services/cloud-infrastructure` | Найдвартай, өргөтгөх боломжтой үүлэн орчин. |
| Digital Marketing | `/services/digital-marketing` | Өсөлтөд чиглэсэн өгөгдөлд суурилсан маркетинг. |
| UI/UX Design | `/services/ui-ux-design` | Хэрэглэгч төвтэй, гоо сайхан интерфейс. |
| E-commerce | `/services/ecommerce` | Борлуулалтыг өсгөх онлайн худалдааны платформ. |

Each carries: 4 `features`, 4 `deliverables`, accent (blue/cyan), dynamic SEO metadata, and links into Industries + relevant case studies.

---

## 4. Portfolio Structure

- **Categories (by industry):** Санхүү · Жижиглэн худалдаа · Эрүүл мэнд · Боловсрол · Логистик · Төрийн байгууллага (derived dynamically from project data — auto-extends).
- **Filtering system:** client-side pill filter ("Бүгд" + each industry), animated `layout` grid (Framer Motion `AnimatePresence`), instant, no reload.
- **Project card:** image (16:10, hover-scale) · industry + year badges · name · 2-line description · 2 result metrics.
- **Case study / project detail** (`/portfolio/[slug]`) fields:
  - **Project name · Industry · Year**
  - **Description**
  - **Technologies** (badge list)
  - **Services** (which pillars were used)
  - **Results** (3-up metric grid)
  - **Gallery** (screenshots, 16:9)
  - **Link** (live site, external)
  - **Next project** navigation + CTA band.

---

## 5. Case Studies Structure

Distinct from Portfolio: long-form **narrative proof** (`/case-studies`, `/case-studies/[slug]`).
**Detail structure:** Hero (client · industry · duration · services) → cover → **Сорилт** (challenge) → **Бидний хандлага** (approach steps) → **Шийдэл** (solution) → **Үр дүн** (4-up metrics) → pull-quote testimonial → CTA. Featured case studies surface on Home.

---

## 6. Blog Structure

- **Categories:** Бүгд · AI ба автоматжуулалт · Хөгжүүлэлт · Дизайн · E-commerce (filter pills).
- **Tags:** free-form per post (e.g. #AI, #SEO, #Next.js); clickable tag filter on index, shown on detail.
- **Author system:** each post has `author` + `authorRole` (shown on card + detail byline). ◐ Dedicated `/blog/author/[name]` pages recommended next; data already carries author.
- **Search:** ✅ client full-text over title/excerpt/author/tags.
- **Article detail:** category badge · title · author · date · reading time · cover · body (paragraphs) · tags · related posts (3).
- **SEO structure:** dynamic metadata + OpenGraph (`type: article`, `publishedTime`, keywords from tags) + **BlogPosting JSON-LD** + included in `sitemap.xml`.

---

## 7. Careers Structure

- **Culture / Why us** (`/careers` top): "Ирээдүйг бидэнтэй хамт бүтээ" + 6 **benefits** (remote-flexible, international projects, learning budget, modern equipment, health insurance, performance bonus).
- **Open positions:** list cards (department · level badges · location · type) → detail.
- **Role detail** (`/careers/[slug]`): summary · **Хариуцах ажил** (responsibilities) · **Тавигдах шаардлага** (requirements) · sidebar (location/type/level) · **Анкет илгээх** apply CTA (mailto, ◐ upgrade to `JobApplication` form + DB — model already exists).

---

## 8. Contact Structure

Single hub (`/contact`) with two tabs + a dedicated quote route.

1. **Lead form (Зурвас)** — name*, email*, phone, company, message* → `/api/contact` → email + `ContactMessage` row. Fires `contact_submit`.
2. **Meeting booking (Уулзалт захиалах)** — name*, email*, phone, company, preferred date/time*, topic, message → `/api/meeting` → email + `Meeting` row (status workflow in admin). Fires `meeting_request`.
3. **Quote request** (`/quote`) — 3-step wizard: ① services (multi-select) → ② budget + timeline → ③ contact details → `/api/quote` → email + `Lead` row. Fires `quote_submit`.

All endpoints: Zod-validated, same-origin (CSRF) + rate-limited; promise "24 цагийн дотор хариу өгнө."

---

## 9. User Journey

| Stage | Mindset | Entry points | What we show | Conversion event | System record |
|---|---|---|---|---|---|
| **Visitor** | "Who's credible in MN?" | Home, Blog, organic/SEO, social | Hero promise → logos → services | scroll-through, blog read | analytics pageview |
| **Lead** | "Can they do *my* thing?" | Services, Industries, Portfolio | capability + matching proof | view case study, click CTA | — |
| **Consultation** | "Talk to a human / get a number" | Contact, Quote, Meeting | low-friction forms, 24h promise | form submit | `Lead` / `ContactMessage` / `Meeting` |
| **Proposal** | "Is the scope/price right?" | follow-up (email), admin pipeline | tailored quote from wizard data | accept proposal | `Lead.status: QUALIFIED → WON` |
| **Project** | "Deliver it well" | onboarding, process | 5-step process, transparency | kickoff | (CRM/PM handoff) |
| **Retention** | "Stay relevant / refer" | Blog, Newsletter, support | insights, continuity offer | subscribe, repeat, referral | `Subscriber` |

Lead status pipeline (admin): **NEW → CONTACTED → QUALIFIED → WON / LOST.**

---

## 10. Conversion Strategy

- **Primary CTA (one, everywhere):** `Үнийн санал авах / Төслөө эхлүүлэх →` → `/quote`. Persistent in nav, hero, CTA band, service pages. Gradient pill = highest visual weight.
- **Secondary CTA:** `Холбоо барих` / `Бүтээлүүдийг үзэх` / `AI шийдэл судлах` — outline/ghost, lower weight, never competes with primary.
- **Lead magnets:** ☐ free digital roadmap / audit ("Үнэгүй дижитал зөвлөгөө"), newsletter ("Дижитал инсайтуудыг сард нэг удаа" ✅), ☐ downloadable guide/checklist gated by email, ☐ ROI/price estimator.
- **Trust signals:** ✅ client logo marquee · ✅ stat counters (120+/50+/8/98%) · ✅ testimonials with names/companies · ✅ case studies with hard metrics · ✅ transparent 5-step process · ✅ 24-hour response promise · ✅ premium craft (the site itself is the proof) · ☐ awards/certifications, partner badges, team faces.

**Conversion rules:** one primary action per view · proof before the ask · forms short & single-column with a confirmation state · CTA repeated at every natural decision point (after services, after portfolio, end of page).

---

*Validated against the live build — `npm run build` → 68 routes. ✅ = implemented, ◐/☐ = roadmap.*
