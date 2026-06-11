# Nuul Digital — Motion System

Premium, restrained motion inspired by Stripe / Linear / Framer / Apple / Vercel.
Built on Framer Motion. **One easing, a few durations, transform+opacity only.**

## Principles
1. **Restraint** — motion guides attention; it is never the show. Max tilt 6°, fades ≤0.8s.
2. **One hand** — every animation pulls from `src/lib/motion.ts` (ease, durations, variants).
3. **60fps** — animate only `transform` & `opacity` (GPU-composited); never `width/top/box-shadow`.
4. **Reveal once** — scroll animations fire a single time (`viewportOnce`), never on every pass.
5. **Mobile-safe** — pointer effects (Tilt/Magnetic/Spotlight) use pointer events, so touch gets the static state.
6. **Accessible** — `<MotionProvider reducedMotion="user">` neutralizes all FM motion for users who ask; global CSS zeroes CSS animations too.

## Tokens — `src/lib/motion.ts`
```ts
export const ease = [0.22, 1, 0.36, 1];          // signature ease-out
export const duration = { fast:.2, base:.3, slow:.5, slower:.7, reveal:.8 };
export const spring = { soft, snappy, gentle };
export const viewportOnce = { once: true, margin: "-80px" };
// variants: fade, fadeUp, scaleIn, stagger(gap), staggerItem, pageTransition
```

## Accessibility foundation — `MotionProvider`
Wrap the app once (already in `app/layout.tsx`):
```tsx
<MotionConfig reducedMotion="user" transition={{ ease, duration: 0.4 }}>
  {children}
</MotionConfig>
```
Result: every `motion.*` component respects OS "Reduce motion" automatically — no per-component code.

---

## 1. Hero animations — `components/sections/hero.tsx`
- Eyebrow / subhead / CTAs: staggered `opacity + y` entrance.
- Headline: `TextReveal` — per-word `y:110%→0` inside `overflow-hidden` clips.
- Stat strip: delayed fade-up. Scroll cue: looping 8px bob.
```tsx
<TextReveal text="дижитал ирээдүйг" className="text-gradient-accent" delay={0.2} />
```

## 2. Page transitions — `components/motion/page-transition.tsx`
Layout-level, keyed by pathname. **First load is not animated** (`initial={false}`) → zero LCP penalty; client navigations fade `opacity + y:8` over 0.3s.
```tsx
<main><PageTransition>{children}</PageTransition></main>
```

## 3. Scroll reveals — `components/motion/reveal.tsx`
```tsx
<Reveal delay={0.1}>…</Reveal>                 // opacity + y, once
<Stagger><StaggerItem>…</StaggerItem></Stagger> // 0.08s children stagger
```
Or compose from tokens:
```tsx
<motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce} />
```

## 4. Portfolio hover — `components/motion/tilt.tsx` (applied in portfolio-showcase)
Subtle spring-smoothed 3D tilt (≤4–6°) toward the cursor + image `scale-105`. Touch devices get the flat card.
```tsx
<Tilt max={4}>
  <Link className="group … overflow-hidden rounded-3xl">
    <Image className="transition-transform duration-700 group-hover:scale-105" />
  </Link>
</Tilt>
```

## 5. Mouse interactions
- **Magnetic** (`magnetic.tsx`) — element drifts toward cursor (hero CTA). `<Magnetic strength={0.35}>`.
- **Spotlight** (`spotlight.tsx`) — sets `--mx/--my` for the `.card-glow` radial highlight; no re-renders.
```tsx
<Spotlight className="card-glow rounded-3xl border border-white/10 bg-card p-6">…</Spotlight>
```

## 6. Background effects — `components/motion/aurora.tsx` (in hero)
Two heavily-blurred brand blobs drift on `x/y/scale` over 18–22s (transform-only, composited). Holds still under reduced motion. Pair with the static `GradientMesh` (grid + radial fade + noise).
```tsx
<section className="relative …"><GradientMesh /><Aurora />…</section>
```

## 7. Loading states — `components/ui/skeleton.tsx` + `app/*/loading.tsx`
Route `loading.tsx` renders shape-matched `CardSkeleton`s with a CSS transform shimmer (no JS). For in-action loading, buttons swap to `<Loader2 className="animate-spin" />` with width locked.
```tsx
// app/blog/loading.tsx
<div className="grid …">{Array.from({length:6}).map((_,i)=><CardSkeleton key={i}/>)}</div>
```

## 8. Statistics counters — `components/motion/counter.tsx`
`useInView` + `useSpring` ramps the number once on entry; thousands-separated, suffix-aware.
```tsx
<Counter to={120} suffix="+" className="text-3xl font-bold" />
```

## 9. Testimonials carousel — `components/sections/testimonials-section.tsx`
`AnimatePresence mode="wait"` crossfade (`opacity + y±20`), prev/next + dot controls, animated active-dot width. Drag-friendly, auto-advance optional.

---

## Performance checklist
- [x] Only `transform`/`opacity` animated (no layout thrash)
- [x] Scroll reveals fire once (`viewport once`)
- [x] Heavy blurs are static-size; only transform animates
- [x] Pointer effects skip touch; no scroll-jank listeners (passive)
- [x] First paint un-animated (LCP-safe page transitions)
- [x] `reducedMotion="user"` global + CSS reduced-motion reset

## Adding a new animation
1. Pull `ease`/`duration`/a variant from `@/lib/motion` — don't invent new timing.
2. Animate transform/opacity only.
3. Add `viewport={viewportOnce}` for scroll-triggered.
4. Verify it disappears gracefully with OS reduce-motion on.
