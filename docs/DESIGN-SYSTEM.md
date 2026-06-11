# Nuul Digital — Design System

> Awwwards-quality, production-ready. Implemented in `tailwind.config.ts`, `globals.css`,
> and `src/lib/design-tokens.ts`. Aesthetic target: Stripe × Linear × Vercel × Notion ×
> Framer × Apple — dark-first, typography-led, premium spacing, quiet motion.

---

## Design Principles → How they're enforced

| Principle | Rule in the system |
|---|---|
| Minimalism | ~90% neutral surface, ≤10% accent. One accent, used rarely. |
| Strong typography | Inter only; size + weight carry all hierarchy. No decorative type. |
| Premium spacing | 4px base scale; sections breathe at 96–128px vertical rhythm. |
| Clear hierarchy | Max 3 type sizes per viewport; one primary action per view. |
| Fast scanning | Eyebrow → headline → 1-line support → action. F-pattern, left-aligned. |
| Elegant animation | One easing `[0.22,1,0.36,1]`; reveal once; 0.2–0.8s; reduced-motion safe. |
| High trust | Real metrics, real screenshots, generous whitespace, no hype copy. |
| Enterprise-ready | AA+ contrast, full keyboard nav, semantic palettes, dark/light parity. |

---

# 1. Design Foundation

## Grid system
- **12-column** fluid grid, **24px gutters** (desktop), **16px** (mobile).
- Content grid via CSS Grid / Flex; cards use `repeat(auto-fit, minmax())` for bento layouts.
- Baseline rhythm: **8px**. Vertical section rhythm: **96px** (`py-24`) → **128px** (`py-32`) on large.
- Bento grid auto-rows: **200px**, featured tiles span 2 columns.

## Container widths
| Token | Max width | Use |
|---|---|---|
| `container-wide` | **1280px** | Default page container, `px-24px` (lg `px-32px`) |
| Prose | **720px** (`max-w-3xl`) | Article/legal/long-form reading |
| Narrow | **640px** (`max-w-2xl`) | Section descriptions, forms |
| Full-bleed | 100vw | Hero backgrounds, marquees, CTA bands |

## Breakpoints
| Token | Min width | Target |
|---|---|---|
| `sm` | **640px** | Large phones |
| `md` | **768px** | Tablets |
| `lg` | **1024px** | Laptops / nav switch to desktop |
| `xl` | **1280px** | Desktop (container cap) |
| `2xl` | **1536px** | Large monitors |

Mobile-first: base styles target ≤640px, scale up. Nav collapses below `lg`.

## Spacing scale (4px base)
`0 · 1(4) · 2(8) · 3(12) · 4(16) · 5(20) · 6(24) · 8(32) · 10(40) · 12(48) · 16(64) · 20(80) · 24(96) · 32(128) · 40(160)`
- Component padding: cards **24px**, large cards **32px**, inputs **16px** x.
- Gaps: tight **8–12px**, default **16–24px**, section **48–64px**.

## Border radius system
| Token | Value | Use |
|---|---|---|
| `sm` | 6px | Tags, small chips |
| `md` | 8px | Inputs hover targets |
| `base` (`--radius`) | **14px** | Inputs, small buttons |
| `lg` | 16px | Nested elements |
| `xl` | 20px | Buttons (full on pills) |
| `2xl` | **28px** | Cards, panels (signature radius) |
| `full` | 9999px | Buttons (pill), avatars, badges, dots |

## Shadow system (tuned for dark surfaces)
| Token | Value |
|---|---|
| `xs` | `0 1px 2px rgba(0,0,0,.24)` |
| `sm` | `0 2px 8px rgba(0,0,0,.30)` |
| `md` | `0 8px 24px rgba(0,0,0,.36)` |
| `lg` | `0 16px 48px rgba(0,0,0,.45)` |
| `xl` | `0 24px 64px rgba(0,0,0,.55)` |
| `glow-accent` | `0 8px 32px rgba(37,99,235,.30)` |
| `glow-cyan` | `0 8px 32px rgba(6,182,212,.25)` |

On dark, depth comes more from **border + subtle glow** than heavy drop shadow.

## Layer system (surfaces)
| Layer | Dark hex | Token |
|---|---|---|
| L0 Background | `#0A0A0A` | `--background` |
| L1 Card / raised | `#121212` | `--card` |
| L2 Muted / sunken | `#1F1F1F` | `--muted` |
| L3 Hover fill | `rgba(255,255,255,.05)` | `white/5` |
| Glass | `rgba(255,255,255,.05)` + `blur(16px)` + border `white/10` | `.glass` |
| Hairline border | `#292929` | `--border` |

## Z-index strategy
`base 0 · raised 10 · sticky 20 · dropdown 30 · overlay 40 · navbar 50 · modal 60 · popover 70 · toast 80 · cursor 90`
Never use arbitrary z-index; always reference the scale (`src/lib/design-tokens.ts → zIndex`).

---

# 2. Typography System

## Font families
- **Display & UI & Body:** `Inter` (Latin + **Cyrillic** subset — required for Mongolian), `system-ui` fallback.
- Features: `cv11`, `ss01`. Antialiased, `optimizeLegibility`.
- Weights: 400 / 500 / 600 / 700 / 800 / 900.

## Heading scales (fluid, `clamp`)
| Token | Clamp | Tracking / Leading | Weight |
|---|---|---|---|
| Display 2XL | `clamp(3rem, 8vw, 7.5rem)` | −0.04em / 0.95 | 800 |
| Display XL | `clamp(2.5rem, 6vw, 5rem)` | −0.03em / 1.0 | 800 |
| Display LG | `clamp(2rem, 4.5vw, 3.5rem)` | −0.02em / 1.05 | 700 |
| H2 | 28→40px | −0.02em / 1.1 | 700 |
| H3 | 20→28px | −0.01em / 1.2 | 600 |
| H4 | 18→20px | normal / 1.3 | 600 |

## Body scales
| Token | Size | Leading | Use |
|---|---|---|---|
| Lead | 18→20px | 1.6 | Section intros, hero subhead |
| Body | 16px | 1.6 | Default paragraph |
| Small | 14px | 1.5 | Captions, meta, card support |
| Eyebrow/Label | 12–13px · UPPERCASE · +0.2em | 1 | Section labels |

## Mobile typography
- Hero caps at ~**48px** (lower clamp bound). H2 ~**28px**. Body **16px** (never below 15px).
- Line length **≤ 38ch** on mobile; reduce tracking tightness on small display sizes.
- Tap-friendly line-height ≥ 1.5 for all body.

## Desktop typography
- Hero up to **120px**; tight tracking (−0.04em) for editorial impact.
- Headlines left-aligned (centered only for testimonials/process intros).

## Reading widths
- Prose: **65ch** (≈720px). Narrow support text: **48ch**. Wide intros: **72ch**.
- Never exceed 75ch for sustained reading.

---

# 3. Color System (exact HEX)

## Primary palette — Signal Blue
`50 #EFF6FF · 100 #DBEAFE · 200 #BFDBFE · 300 #93C5FD · 400 #60A5FA · 500 #3B82F6 · `**`600 #2563EB (brand)`**` · 700 #1D4ED8 · 800 #1E40AF · 900 #1E3A8A`

## Secondary palette — Sky / Cyan
`50 #ECFEFF · 100 #CFFAFE · 200 #A5F3FC · 300 #67E8F9 · 400 #22D3EE · `**`500 #06B6D4 (brand)`**` · 600 #0891B2 · 700 #0E7490 · 800 #155E75 · 900 #164E63`
- Brand gradient **The Migration**: `#2563EB → #06B6D4` (135°).

## Neutral palette — Steppe
`0 #FFFFFF · 50 #FAFAFA · 100 #F5F5F5 · 200 #E5E5E5 · 300 #D4D4D4 · 400 #A3A3A3 · 500 #737373 · 600 #525252 · 700 #404040 · 800 #262626 · 900 #171717 · `**`950 #0A0A0A (ink)`**

## Success — Emerald
`50 #F0FDF4 · `**`500 #22C55E`**` · 600 #16A34A · 700 #15803D`

## Warning — Amber
`50 #FFFBEB · `**`500 #F59E0B`**` · 600 #D97706 · 700 #B45309`

## Error — Red
`50 #FEF2F2 · `**`500 #EF4444`**` · 600 #DC2626 · 700 #B91C1C`

## Information — Sky
`50 #F0F9FF · `**`500 #0EA5E9`**` · 600 #0284C7 · 700 #0369A1`

**Usage rule:** semantic colors only for feedback (toasts, validation, badges, alerts) — never decoratively, to keep the accent meaningful.

---

# 4. Component Library — Specs

### Navigation (Navbar)
Floating pill, `max-w-1280`, fixed `top-16px`. Transparent at scroll 0 → `.glass` + shadow after 24px. Active link uses a shared-layout pill (`layoutId`). Logo = Migration Mark + live node. Primary CTA (gradient pill) right-aligned. Height ~64px. Collapses to sheet below `lg`.

### Mega Menu (Services)
Trigger "Үйлчилгээ" opens a full-width glass panel under the nav: 3-col grid of service tiles (icon + title + 1-line), a featured promo column (gradient, links to /quote), animated in with `opacity + y(-8)`, 0.2s. Keyboard: arrow-nav, Esc closes, focus trap while open.

### Buttons
Pill (`rounded-full`), `active:scale-[.98]`, 0.3s transitions, `[&_svg]:size-4`.
| Variant | Fill | Use |
|---|---|---|
| `default` | Accent `#2563EB`, glow shadow | Primary |
| `gradient` | Migration gradient | Hero / highest intent |
| `outline` | `white/5` + border `white/15`, blur | Secondary |
| `light` | White on dark CTA bands | On gradient |
| `ghost` | transparent → `white/5` | Tertiary |
| `link` | accent, underline on hover | Inline |
Sizes: sm 36px · default 44px · lg 56px · icon 44². Min touch target 44px.

### Cards
`rounded-2xl` (28px), border `white/10`, bg `--card`. Hover: `-translate-y-1`, border `white/20`, optional `card-glow` (radial spotlight tracking cursor). 24–32px padding.

### Portfolio Cards
Image (16/10) with `scale-105` on hover (0.7s), bottom gradient scrim, floating round arrow button (→ accent on hover), industry + year badges, title, 2-line clamp, 2–3 inline result metrics (cyan).

### Case Study Cards
Split 2-col (image / content), alternating sides. Industry badge + duration, title, excerpt, 3 result stats, "Кейс унших →". Full-width, stacked on mobile.

### Forms
Single column, label-above-input, 20px row gap, 2-up on `sm`. Required `*`. Inline validation, error text in `error.500` with icon. Success = full-panel confirmation state (no inline-only).

### Input Fields
Height 48px, `rounded-xl`, bg `white/[.03]`, border `--input`. Focus: border `accent/50` + ring `accent/20` (2px). Placeholder `muted/70`. Disabled 50% opacity.

### Selects
Match input metrics. Chevron right, 0.3s rotate on open. Options panel = glass, `rounded-xl`, 8px padding, hover `white/5`, selected = `accent/10` + check.

### Text Areas
Min-height 120px, vertical resize, same field styling as inputs.

### Badges
Pill, 12px text, `px-3 py-1`. Variants: `default` (neutral), `accent`, `cyan`, `solid`. Borders tinted to fill.

### Tags
Smaller than badges, `rounded-full`, neutral border, used for tech stacks / filters. Active filter = accent fill + white text.

### Testimonials
Centered carousel card, `rounded-2xl`, 32–48px padding. 5 cyan stars, balanced 20–24px quote, avatar (ring `accent/30`) + name + role/company. Dots + prev/next; drag + auto-advance, `AnimatePresence` crossfade (y±20).

### Statistics
Big number (`Counter`, spring 1.8s, triggers in-view) in 32–40px bold, accent suffix, 14px label below. Arranged in a bordered 2–4 col grid with hairline dividers (`gap-px` on `white/5`).

### Pricing Cards (system-ready)
3-tier row, middle = "featured" with accent border + glow + "Эрэлттэй" badge & subtle `-translate-y-2`. Tier name, price (display size), `/сар` note, feature list with check icons (accent), full-width CTA. Equal-height.

### Feature Cards
Icon tile (48², `accent/10` bg, accent icon; cyan variant for AI), title, 1–2 line support. Bento sizing — featured spans 2 cols.

### Accordion (FAQ)
Radix accordion. Trigger: 18px medium, chevron rotates 180° (0.3s), hover → accent. Content animates height (`accordion-down/up` 0.2s). Hairline divider per item.

### FAQ
Single-column accordion, `max-w-3xl` centered, optional 2-col on `xl`. 5–8 items.

### Footer
4-col (brand+contact / 3 link cols), top accent glow, newsletter panel (`rounded-2xl`), bottom bar (© + socials). Hairline dividers, muted links → foreground on hover.

### CTA Blocks
Full-width `rounded-[32px]` panel, **Migration gradient** bg, grid overlay + blurred orbs, centered display headline + support + dual buttons (light + glass). High emphasis, used once per page near end.

---

# 5. Homepage Components

| Section | Spec summary |
|---|---|
| **Hero** | 100svh, gradient-mesh + grid + noise bg, eyebrow → word-by-word display headline → lead → dual CTA → 4-stat strip → scroll cue. |
| **Trusted By** | Eyebrow line + infinite logo **marquee** (grayscale → color on hover, pause on hover), edge mask-fade. |
| **Services Grid** | Bento (`auto-rows-200px`, featured 2-span), icon tile + title + 1-liner, cursor-tracking glow, arrow reveal on hover. |
| **Portfolio Showcase** | 2-col, first item full-width; image parallax-scale, scrim, badges, result metrics, → detail. |
| **Case Studies** | Alternating split cards with stats + "read" link. |
| **Process Timeline** | 5-step horizontal stepper, gradient connector line, icon node + step number + title + copy; stacks vertical on mobile. |
| **Client Testimonials** | Carousel (see component). |
| **FAQ** | Accordion (see component). |
| **AI & Automation** | Dark spotlight band, cyan accent, animated chat mock (staggered message reveal), capability grid, CTA. |
| **Contact CTA** | Split: section heading + contact detail cards / form panel. Plus global gradient CTA band above footer. |

---

# 6. Motion System (Framer Motion)

**Constitution:** one easing `easeOut = [0.22, 1, 0.36, 1]`; springs `{stiffness 380, damping 30}`; durations 0.1–0.8s; **reveal once** (`viewport={{ once: true, margin: "-80px" }}`); everything degrades under `prefers-reduced-motion`.

### Scroll animations
- `Reveal`: `opacity 0→1`, `y 28→0`, 0.7s. `Stagger`/`StaggerItem`: 0.08s children stagger.
- `TextReveal`: per-word `y 110%→0` inside `overflow-hidden`, 0.06s stagger.
- `Counter`: `useInView` + `useSpring` (1.8s) number ramp.
- Parallax: image `scale 1→1.05` on hover (0.7s); subtle background drift only.

### Hover interactions
- Cards: lift `-translate-y-1` + border brighten + radial glow follows cursor (CSS vars `--mx/--my`).
- Buttons: brightness/shadow up, `active:scale-.98`; `Magnetic` wrapper for hero CTA (spring pull, strength 0.35).
- Links/nav: shared-layout pill (`layoutId="nav-pill"`).

### Loading states
- Skeletons: `white/5` blocks with shimmer (`translateX -100→100%`). Buttons → spinner (`Loader2 animate-spin`), label hidden, width locked. Route data uses `loading.tsx` skeletons (no spinners on full page).

### Page transitions
- App Router segment fades (`opacity + y(8)`, 0.3s). Avoid heavy full-page wipes — keep nav persistent.

### Micro-interactions
- Chevron rotation (accordion/select), live-dot pulse, toast slide-in (y+spring), input focus ring grow, copy-confirm checkmark, marquee pause-on-hover, scroll-cue bounce.

**Performance:** animate only `transform` & `opacity`; `will-change` sparingly; never animate layout-affecting props in lists; use `AnimatePresence mode="wait"` for swaps.

---

# 7. Accessibility (WCAG 2.2 AA, targeting AAA on body)

### Color contrast
- Body text on `#0A0A0A`: foreground `#FAFAFA` ≈ **18:1** (AAA). Muted `#A3A3A3` ≈ **6.4:1** (AA+).
- Accent `#2563EB` on white **AA**; on dark use white text on accent (AA). Never accent text on accent fill.
- Don't encode meaning in color alone — pair with icon/label (validation, status).

### Keyboard navigation
- All interactive elements reachable in logical order; no positive tabindex.
- Mega menu & mobile sheet: focus trap, Esc to close, return focus to trigger.
- Carousel: arrow keys, visible focus on controls. Accordion: Enter/Space toggles.
- "Skip to content" link as first focusable element.

### Focus states
- Visible ring on every focusable: `ring-2 ring-ring ring-offset-2 ring-offset-background` (accent ring). Never `outline:none` without a replacement. `:focus-visible` only (no mouse-click rings).

### Semantics & motion
- One `<h1>` per page; ordered headings. Landmarks: `header/nav/main/footer`. `aria-label` on icon-only buttons. Images have alt; decorative marked `aria-hidden`.
- `prefers-reduced-motion`: all animation/transition reduced to ~0ms (already global). Min target 44×44px. Form inputs have associated `<label>`.

---

# 8. Dark Mode (default) & Light Mode

Dark-first brand. `.dark` is the default on `<html>`; `.light` overrides via CSS vars. Both ship full token parity.

| Token | Dark | Light |
|---|---|---|
| `--background` | `0 0% 4%` (#0A0A0A) | `0 0% 100%` (#FFFFFF) |
| `--foreground` | `0 0% 98%` | `0 0% 4%` |
| `--card` | `0 0% 7%` | `0 0% 100%` |
| `--muted` | `0 0% 12%` | `0 0% 96%` |
| `--muted-foreground` | `0 0% 64%` | `0 0% 40%` |
| `--border` / `--input` | `0 0% 16%` | `0 0% 90%` |
| `--ring` / `--primary` | `221 83% 53%` | `221 83% 53%` |
| `--success` | `142 71% 45%` | `142 71% 40%` |
| `--warning` | `38 92% 50%` | `38 92% 45%` |
| `--error` | `0 84% 60%` | `0 78% 53%` |
| `--info` | `199 89% 48%` | `199 89% 44%` |

**Light-mode rules:** depth from soft shadows (not glow); borders darken; gradient and accent stay identical; reduce blur intensity; ensure semantic colors shift one step darker for AA on white.

---

# 9. Deliverables (rules)

### Design Tokens
Source of truth: `tailwind.config.ts` (Tailwind utilities) + `globals.css` (CSS vars, theme-aware) + `src/lib/design-tokens.ts` (JS — for OG images, charts, Figma sync). Never hardcode a hex in a component — reference a token.

### Component Specifications
Each component: variants, sizes, states (default/hover/focus/active/disabled/loading/error), radius, spacing, motion. Primitives live in `src/components/ui`, composites in `sections`/`shared`. Single source per component (no duplicates).

### UX Rules
1. One primary action per view. 2. Eyebrow → headline → support → action. 3. Show proof (metrics, logos, screenshots) before asking. 4. Forms: short, single-column, inline validation, confirmation state. 5. Never block content behind motion. 6. Copy leads with outcome, not technology.

### Layout Rules
1. `container-wide` (1280) for all page content. 2. Section rhythm 96→128px. 3. 12-col / bento grids; featured tiles span 2. 4. Left-aligned by default; center only testimonials/process/CTA. 5. Hairline (`white/10`) over heavy dividers. 6. Max 3 type sizes visible at once.

### Mobile Rules
1. Mobile-first; nav → sheet below `lg`. 2. Min 44px targets, 16px min body. 3. Stack all split layouts; horizontal steppers → vertical. 4. Reduce hero clamp + tracking. 5. Edge padding 24px. 6. Marquees/carousels remain swipe-friendly; disable parallax on touch.

### Motion Rules
1. One easing, one spring config. 2. 0.1–0.8s only. 3. Reveal once, not on every scroll. 4. Animate transform/opacity only. 5. Stagger lists at 0.06–0.08s. 6. Always honor `prefers-reduced-motion`. 7. Loading = skeleton (page) or inline spinner (action), never both.

---

*Implemented & verified: `npm run build` → 48 routes, all tokens compile.*
