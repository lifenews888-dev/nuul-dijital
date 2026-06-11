# Launch Checklist — Nuul Digital

## Content
- [ ] Replace placeholder copy with final Mongolian (and EN if bilingual) content
- [ ] Real project screenshots & case-study assets (replace Unsplash placeholders)
- [ ] Real client logos in Trusted By
- [ ] Team photos & bios on /about
- [ ] Verified testimonials with permission
- [ ] Final pricing (if Pricing Cards are enabled)

## Brand & assets
- [ ] Favicon/OG render correctly (`/icon`, `/opengraph-image`)
- [ ] Logo variants in `public/logo.svg`
- [ ] `NEXT_PUBLIC_SITE_URL` set to production domain

## Functionality
- [ ] Contact, Quote, Meeting, Newsletter forms submit successfully
- [ ] Resend emails arrive at `CONTACT_TO_EMAIL`
- [ ] DB rows created for each submission (Lead / ContactMessage / Meeting / Subscriber)
- [ ] Admin login works; CRUD on posts/projects/case-studies/testimonials/careers
- [ ] Lead/contact/meeting status updates + delete work
- [ ] 404 page renders

## SEO
- [ ] Per-page titles & descriptions reviewed
- [ ] `sitemap.xml` lists all routes
- [ ] `robots.txt` disallows `/admin` and `/api`
- [ ] Organization + BlogPosting JSON-LD present
- [ ] OG/Twitter cards preview correctly (Slack/Twitter/LinkedIn debuggers)
- [ ] Canonical URLs correct
- [ ] Submit sitemap to Google Search Console

## Performance (Lighthouse 95+)
- [ ] Mobile + desktop Lighthouse ≥ 95 (Perf/SEO/Best Practices/Accessibility)
- [ ] Images sized & lazy-loaded; LCP image priority set
- [ ] No layout shift (CLS < 0.1)
- [ ] JS bundle reviewed; client components minimal
- [ ] Fonts `display: swap`, preloaded

## Accessibility (WCAG 2.2 AA)
- [ ] Keyboard nav through all interactive elements
- [ ] Visible focus rings everywhere
- [ ] Color contrast AA+ on all text
- [ ] Alt text on all meaningful images
- [ ] `prefers-reduced-motion` respected
- [ ] One `<h1>` per page, ordered headings

## Security
- [ ] Security headers verified (securityheaders.com)
- [ ] `AUTH_SECRET` set, strong `ADMIN_PASSWORD`
- [ ] Rate limiting active on form endpoints (consider Upstash for scale)
- [ ] CSP reviewed (tighten `script-src` once inline needs are mapped)
- [ ] HTTPS enforced (HSTS)
- [ ] No secrets in client bundle / repo

## Analytics
- [ ] GA4 and/or Plausible receiving pageviews
- [ ] Events firing: `contact_submit`, `quote_submit`, `meeting_request`
- [ ] Cookie/consent notice if required by jurisdiction

## Infra
- [ ] Production PostgreSQL provisioned & migrated (`prisma migrate deploy`)
- [ ] DB backups enabled
- [ ] Resend domain verified (SPF/DKIM)
- [ ] Custom domain + SSL on Vercel
- [ ] Preview deployments protected
- [ ] Error monitoring (Sentry/Vercel) configured
