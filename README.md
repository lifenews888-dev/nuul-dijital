# Nuul Digital — Premium Digital Agency Website

A world-class, award-style website for **Nuul Digital**, a modern Mongolian digital
transformation agency. Built with Next.js 15, TypeScript, Tailwind CSS, Framer Motion,
Prisma and Resend. Mongolian-first (Cyrillic) content, dark premium aesthetic.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![TS](https://img.shields.io/badge/TypeScript-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4)

## ✨ Features

- **8 full pages** + dynamic detail routes: Home, About, Services, Portfolio, Case Studies,
  Blog, Careers, Contact (+ Quote wizard, legal pages, custom 404).
- **10-section homepage**: Hero · Trusted By · Services bento · Why Nuul · Portfolio ·
  AI & Automation · Testimonials · Process · CTA · Contact.
- **Motion everywhere** — scroll reveals, staggered entries, word-by-word headline reveal,
  magnetic buttons, animated counters, marquee, animated AI chat mock. Respects
  `prefers-reduced-motion`.
- **Premium design system** — brand tokens (`#0A0A0A` / `#FFFFFF` / `#2563EB` / `#06B6D4`),
  Inter (latin + cyrillic), shadcn-style UI primitives, glassmorphism, gradient mesh.
- **Working forms** — multi-step quote wizard, contact form, newsletter, all wired to
  Resend API routes (degrade gracefully to console logging without an API key).
- **Full SEO** — dynamic per-page metadata, OpenGraph, `sitemap.xml`, `robots.txt`,
  JSON-LD (Organization + BlogPosting), dynamically generated OG image & favicon.
- **Production-ready data layer** — Prisma schema (PostgreSQL) + seed, NextAuth (Auth.js v5).

## 🚀 Getting started

```bash
npm install
cp .env.example .env      # fill in values (all optional for local UI dev)
npm run dev               # http://localhost:3000
```

The site runs fully without any environment variables — forms log to the console and
content comes from `src/data/*`. Add env vars to enable email and the database.

## 🔧 Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (Prisma) |
| `RESEND_API_KEY` | Transactional email (contact / quote / newsletter) |
| `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` | Email routing |
| `AUTH_SECRET` / `AUTH_URL` | NextAuth (Auth.js v5) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials login for the admin area |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO |

## 🗄️ Database

```bash
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to your PostgreSQL
npm run db:seed       # seed services, projects, posts, jobs, testimonials
```

Models: `User/Account/Session` (auth), `Service`, `Project`, `CaseStudy`, `Post`,
`Testimonial`, `Job`, `JobApplication`, `Lead` (quotes), `ContactMessage`, `Subscriber`.

> The marketing pages currently read from typed data modules in `src/data/` so the site
> works with zero infrastructure. To go fully dynamic, swap those reads for `db.*` queries
> (the API routes already include commented `db.create(...)` calls).

## 📁 Project structure

```
src/
├── app/                     # App Router: pages, API routes, sitemap/robots/og
│   ├── (pages)              # /about /services /portfolio /case-studies /blog /careers ...
│   ├── api/                 # /contact /quote /subscribe /auth
│   ├── sitemap.ts robots.ts manifest.ts opengraph-image.tsx icon.tsx
├── components/
│   ├── ui/                  # Button, Card, Badge, Input, Accordion … (shadcn-style)
│   ├── motion/              # Reveal, Stagger, TextReveal, Counter, Magnetic, Marquee
│   ├── sections/            # Homepage sections (Hero, Services, AI, Process …)
│   ├── layout/              # Navbar, Footer
│   ├── forms/               # ContactForm, QuoteWizard, NewsletterForm
│   └── shared/              # PageHeader, SectionHeading, GradientMesh, JsonLd
├── data/                    # Mongolian content (services, projects, posts, jobs …)
├── lib/                     # utils, seo, site config, fonts, db, auth, mail, validations
prisma/                      # schema.prisma + seed.ts
```

## 🧱 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (all routes prerendered) |
| `npm start` | Serve production build |
| `npm run typecheck` | TypeScript check |
| `npm run db:*` | Prisma generate / push / seed |

## 🎨 Brand

| Token | Value |
|---|---|
| Primary (ink) | `#0A0A0A` |
| Secondary (paper) | `#FFFFFF` |
| Accent | `#2563EB` |
| Accent (cyan) | `#06B6D4` |
| Type | Inter (Bold display / Regular body) |

## 🌍 Deployment

Optimized for **Vercel**. The repo (`github.com/bizprintpro-alt/nuul-digital`)
is connected to the Vercel project, so **pushing to `main` auto-deploys to
production** (https://nuul.digital). `output` tracing is scoped to this project
in `next.config.mjs`.

After a schema change, run `prisma db push` (or `migrate deploy`) and
`npm run db:seed` (idempotent) against the production database.

---

Built with care for the Mongolian market. 🇲🇳
