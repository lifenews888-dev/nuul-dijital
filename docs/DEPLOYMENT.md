# Deployment Guide — Nuul Digital

Production target: **Vercel** + **PostgreSQL** (Neon / Supabase / Vercel Postgres) + **Resend**.

## 1. Prerequisites
- Node 18.18+ (20+ recommended), npm 10+.
- A PostgreSQL database URL.
- A Resend account + verified sending domain.
- (Optional) Google Analytics 4 ID and/or a Plausible domain.

## 2. Environment variables
Copy `.env.example` → `.env` and fill in. On Vercel, add the same keys under
**Project → Settings → Environment Variables** (Production + Preview).

| Key | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | `npx auth secret` |
| `AUTH_URL` | ✅ (prod) | e.g. `https://nuul.digital` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | Admin login (Credentials provider) |
| `RESEND_API_KEY` | ✅ | Transactional email |
| `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` | ✅ | Email routing (`FROM` must be a verified Resend domain) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical URL (SEO, sitemap, OG) |
| `NEXT_PUBLIC_GA_ID` | — | GA4 measurement ID |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | — | Plausible site domain |

## 3. Database
```bash
npm run db:generate      # generate Prisma client
npm run db:push          # apply schema to PostgreSQL
npm run db:seed          # seed services/projects/posts/jobs/testimonials
```
For migration history in production, prefer `npx prisma migrate deploy` over `db push`.

## 4. Local development
```bash
npm install
npm run dev               # http://localhost:3000
```
The public site runs without any env vars (content from `src/data/*`, forms log to console).
The **admin** (`/admin`) requires `AUTH_SECRET` + `ADMIN_EMAIL` + `ADMIN_PASSWORD`, and a
`DATABASE_URL` to show/edit data.

## 5. Deploy to Vercel
1. Push the repo to GitHub/GitLab.
2. Import into Vercel — framework auto-detected (Next.js).
3. Add environment variables (above).
4. Build command `next build`, output handled automatically.
5. Add the Prisma generate step — already wired via `postinstall`-safe `db:generate`
   (run `prisma generate` in the build if you add a custom build command:
   `prisma generate && next build`).
6. Point your domain (`nuul.digital`) at Vercel and set `AUTH_URL` / `NEXT_PUBLIC_SITE_URL`.

## 6. Content sourcing strategy
- **Public marketing pages** render from typed modules in `src/data/*` and are statically
  generated (SSG) for maximum Lighthouse performance — no DB round-trips on the hot path.
- **The Admin CMS** performs real CRUD against PostgreSQL (Prisma). The DB is the system of
  record; `prisma/seed.ts` loads the same starter content the static modules ship with.
- To make a public section **fully DB-driven**, replace its `import { x } from "@/data/..."`
  with a Prisma query (`db.post.findMany(...)`) and either keep the page dynamic or use
  `revalidate`/`revalidatePath` (the admin actions already call `revalidatePath`). Add
  `export const revalidate = 60` (ISR) to keep SSG-like speed with periodic refresh.

## 7. Performance & caching
- Server Components by default; client islands only where interactive (forms, carousels, nav).
- `next/image` (AVIF/WebP) + remote patterns configured.
- `optimizePackageImports` for `lucide-react` and `framer-motion`.
- Static routes are CDN-cached by Vercel; admin/API are dynamic.
- Fonts via `next/font` (Inter, self-hosted, `display: swap`).

## 8. Security (configured)
- Secure headers (CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy)
  in `next.config.mjs`.
- Edge `middleware.ts` guards `/admin`; authoritative role check in the admin layout.
- API mutations: same-origin (CSRF) check + in-memory rate limiting (`src/lib/security.ts`).
  Swap the limiter Map for Upstash Redis for multi-instance production.
- All inputs validated with Zod before persistence/email.

## 9. Post-deploy smoke test
```bash
curl -I https://nuul.digital/                 # 200 + security headers
curl https://nuul.digital/sitemap.xml         # 200
curl https://nuul.digital/robots.txt          # 200
# submit contact/quote/meeting forms; confirm Resend email + DB rows
# log into /admin with ADMIN_EMAIL/ADMIN_PASSWORD
```
