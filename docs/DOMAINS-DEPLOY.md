# Domains Module — Production Deploy Guide

Phase 1 GA checklist for `nuul.digital` domain search, checkout, QPay, bank transfer, and admin fulfillment.

Primary design reference: [DOMAINS-MODULE-DESIGN.md](./DOMAINS-MODULE-DESIGN.md)

---

## 1. Prerequisites

| Service | Purpose |
|---|---|
| **PostgreSQL** | Orders, payments, TLD pricing, feature flags |
| **Resend** | Order / payment / fulfillment emails |
| **QPay v2** | Online domain checkout |
| **Upstash Redis** | **GA blocker** — shared rate limits across serverless instances |
| **Vercel Cron** | Hourly payment expiration (`expire-payments`) |

---

## 2. Environment variables (Production)

Add to Vercel **Project → Settings → Environment Variables** (Production + Preview for staging).

### Core

| Key | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://nuul.digital` |
| `RESEND_API_KEY` | ✅ | Transactional email |
| `CONTACT_FROM_EMAIL` | ✅ | Verified Resend domain |
| `CONTACT_TO_EMAIL` | ✅ | Admin inbox |
| `CRON_SECRET` | ✅ | Protects `/api/cron/*` |

### QPay

| Key | Required | Notes |
|---|---|---|
| `QPAY_USERNAME` | ✅ | Merchant username |
| `QPAY_PASSWORD` | ✅ | Merchant password |
| `QPAY_INVOICE_CODE` | ✅ | Invoice template code |
| `QPAY_ENV` | ✅ | `production` for live |
| `QPAY_CALLBACK_URL` | ✅ | `https://nuul.digital/api/payments/qpay/callback` |

### Upstash Redis (GA blocker)

| Key | Required | Notes |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | ✅ prod | From [Upstash Console](https://console.upstash.com/) → Redis → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ prod | Pair with URL above |

Without Upstash, `src/lib/rate-limit.ts` falls back to **in-memory** limits per serverless instance — insufficient for production traffic.

### Optional overrides

| Key | Default | Notes |
|---|---|---|
| `DOMAINS_MODULE_ENABLED` | `false` (DB flag) | Set `true` to bypass DB flag for smoke tests |

---

## 3. Upstash setup

1. Create a Redis database in Upstash (region close to Vercel deployment, e.g. `ap-southeast-1`).
2. Copy **REST URL** and **REST TOKEN** into Vercel env vars.
3. Redeploy so functions pick up the new variables.
4. Verify:

```bash
curl https://nuul.digital/api/health/rate-limit
# Expected: { "backend": "upstash", "configured": true, "ok": true, "productionSafe": true }
```

Local / CI script:

```bash
npm run verify:domains-deploy
# Or against staging:
BASE_URL=https://your-preview.vercel.app npm run verify:domains-deploy
```

---

## 4. Application rate limits

Enforced in `src/lib/security.ts` → `guardMutation()` → `rateLimit()`:

| Endpoint | Key prefix | Limit | Window |
|---|---|---|---|
| `POST /api/domains/search` | `domain-search:{ip}` | 20 | 60s |
| `POST /api/domains/orders` | `domain-order:{ip}` | 5 | 60s |
| `POST /api/payments/qpay/create` | `qpay-create:{ip}` | 10 | 60s |
| `GET /api/payments/qpay/check` | `qpay-check:{ip}` | 30 | 60s |

Store: **Upstash Redis** when configured; in-memory fallback for local dev only.

---

## 5. Vercel Firewall rule templates

Use as **interim mitigation** on staging before Upstash is live, or as a **defense-in-depth** layer after GA.

Rules are staged as drafts — publish with `vercel firewall publish --yes` after review.

### 5.1 Domain search (20 req / 60s per IP)

```bash
vercel firewall rules add "Domains search rate limit" \
  --condition '{"type":"path","op":"pre","value":"/api/domains/search"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 20 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --yes
```

### 5.2 Domain orders (5 req / 60s per IP)

```bash
vercel firewall rules add "Domains order rate limit" \
  --condition '{"type":"path","op":"pre","value":"/api/domains/orders"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 5 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --yes
```

### 5.3 QPay create (10 req / 60s per IP)

```bash
vercel firewall rules add "QPay create rate limit" \
  --condition '{"type":"path","op":"pre","value":"/api/payments/qpay/create"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 10 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --yes
```

### 5.4 QPay check (30 req / 60s per IP)

```bash
vercel firewall rules add "QPay check rate limit" \
  --condition '{"type":"path","op":"pre","value":"/api/payments/qpay/check"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 30 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --yes
```

### 5.5 Log-only mode (tune before enforce)

Replace `--rate-limit-action rate_limit` with `--action log` and omit rate-limit flags to observe traffic first.

### 5.6 System bypass for QPay webhook (if using challenge rules)

QPay callbacks must reach `/api/payments/qpay/callback` without CSRF challenges:

```bash
vercel firewall system-bypass add "QPay callback" \
  --path "/api/payments/qpay/callback" \
  --yes
```

---

## 6. Cron jobs

Configured in `vercel.json`:

| Path | Schedule | Auth |
|---|---|---|
| `/api/cron/domains/expire-payments` | `0 * * * *` (hourly) | `Authorization: Bearer $CRON_SECRET` |
| `/api/cron/import-vercel` | `0 6 * * *` (daily) | Same |

Smoke test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://nuul.digital/api/cron/domains/expire-payments
# Expected: { "ok": true, "expired": 0, "errors": 0 }
```

---

## 7. Enable the module

1. Apply schema: `npx prisma migrate deploy` (or `npm run db:push` on staging).
2. Seed: `npm run db:seed`
3. Enable flag:

```bash
npm run domains:enable
# Or set SiteSetting domains_module_enabled=true in /admin (future UI)
```

4. Configure bank account in `/admin/settings` (bank transfer fallback).
5. Set TLD prices in `/admin/domains/pricing` if seed values need adjustment.

---

## 8. GA launch checklist

### Infrastructure

- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set on **Production**
- [ ] `GET /api/health/rate-limit` returns `ok: true`, `backend: "upstash"`
- [ ] `GET /api/health/domains` returns `ok: true` (RDAP + rate limit)
- [ ] `CRON_SECRET` set; expire-payments cron succeeds
- [ ] QPay production credentials + callback URL verified

### Legal & content

- [ ] `GET /mn/legal/domain-registration` returns 200
- [ ] Legal copy reviewed (MN + EN)
- [ ] Bank details correct in `/admin/settings`

### Feature flags (`SiteSetting`)

- [ ] `domains_module_enabled` = `true`
- [ ] `domains_qpay_enabled` = `true` (or `false` for bank-only launch)

### Smoke test (production)

- [ ] `/domains?q=test` — search returns results
- [ ] Guest checkout — order created
- [ ] QPay modal — invoice + poll succeeds (sandbox first)
- [ ] Admin `/admin/domains/orders` — order visible, fulfillment workflow works
- [ ] `npm run verify:domains-deploy` passes against production URL

### Optional hardening

- [ ] Vercel Firewall rate rules published (section 5)
- [ ] Attack Mode playbook documented for RDAP abuse spikes

---

## 9. Staged rollout

| Stage | Gate |
|---|---|
| **Internal** | Upstash on staging; module flag on preview |
| **Beta** | Legal sign-off; QPay sandbox E2E |
| **Soft launch** | Homepage teaser only; module flag on prod |
| **GA** | Full nav link; Upstash verified; firewall optional |

---

## 10. Troubleshooting

| Symptom | Check |
|---|---|
| 429 on search but low traffic | Upstash missing → per-instance memory limits; configure Upstash |
| QPay callback 403 | Firewall challenge blocking — add system bypass (5.6) |
| Orders stuck PENDING_PAYMENT | Cron running? `CRON_SECRET` correct? |
| `health/domains` 503 | RDAP down or Upstash not production-safe |
| Domain still "available" after order | Partial unique index + cache; expire cron releases EXPIRED orders |

---

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md) — general Vercel deploy
- [ADMIN-ARCHITECTURE.md](./ADMIN-ARCHITECTURE.md) — admin RBAC
- [DOMAINS-MODULE-DESIGN.md](./DOMAINS-MODULE-DESIGN.md) — full system design