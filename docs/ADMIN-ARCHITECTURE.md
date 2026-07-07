# Nuul Digital — Enterprise CMS Architecture

A role-based, audited, versioned content management system built into the Next.js app
(App Router + Server Actions + Prisma/PostgreSQL). No separate backend.

## 1. Managed entities

| Entity | Status workflow | SEO | Revisions | CRUD route |
|---|---|---|---|---|
| Pages | ✅ | ✅ | ✅ | `/admin/pages` |
| Blog Posts | ✅ | ✅ | ✅ | `/admin/posts` |
| Portfolio Projects | ✅ | ✅ | ✅ | `/admin/projects` |
| Case Studies | ✅ | ✅ | ✅ | `/admin/case-studies` |
| Team Members | — | — | — | `/admin/team` |
| Careers (Jobs) | ✅ | — | — | `/admin/careers` |
| Testimonials | published flag | — | — | `/admin/testimonials` |
| FAQs | published flag | — | — | `/admin/faqs` |
| Media Library | — | — | — | `/admin/media` |
| Leads (quotes) | pipeline | — | — | `/admin/leads` |
| Contact Requests | read flag | — | — | `/admin/contacts` |
| Meetings | pipeline | — | — | `/admin/meetings` |
| Domain Orders | pipeline | — | — | `/admin/domains/orders` |
| TLD Pricing | active flag | — | — | `/admin/domains/pricing` |
| Activity Log | — | — | — | `/admin/activity` |

## 2. Status workflow

`ContentStatus = DRAFT · PUBLISHED · SCHEDULED · ARCHIVED` on Page/Post/Project/CaseStudy/Job.
- `publishedAt` set when a record moves to PUBLISHED.
- `scheduledAt` captured for SCHEDULED items.
- A public "is-live" query filters `status = PUBLISHED OR (status = SCHEDULED AND scheduledAt <= now())`.
- Publishing requires the `content:publish` permission (Authors cannot publish — they save DRAFTs).

## 3. Role permissions (RBAC) — `src/lib/rbac.ts`

| Role | Capability |
|---|---|
| **SUPER_ADMIN** | `*` — everything, incl. users & settings |
| **ADMIN** | all content + testimonials/team/faqs/jobs + media + leads + **domains:\*** + read activity |
| **EDITOR** | create/read/update/**publish** content, manage testimonials/faqs/jobs, media (no delete), read leads, **domains:read/update**, read activity |
| **AUTHOR** | create/read/update content (no publish, no delete), upload media |

Permissions are `resource:action` strings (`content`, `testimonials`, `team`, `faqs`, `jobs`,
`media`, `leads`, `domains`, `activity`, `users`, `settings` × `create/read/update/delete/publish/manage`)
with `*` wildcards. `can(role, resource, action)` and `assertCan(...)` enforce it; the admin
sidebar is filtered by `visibleSections(role)`. Every server action calls `requirePermission()`.

Auth: Auth.js v5 Credentials (JWT). The env admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) logs in as
**SUPER_ADMIN**. The `User` model carries `role` + `passwordHash` for DB-backed multi-user setups.

## 4. Media Library — `src/lib/.../media`

- Model `MediaAsset` (url, type IMAGE/VIDEO/DOCUMENT, filename, mimeType, size, dimensions, alt).
- **Upload:** `POST /api/admin/media` (auth + `media:create`) streams the file to **Vercel Blob**
  (`@vercel/blob`, when `BLOB_READ_WRITE_TOKEN` is set) and creates the asset row.
- **URL register:** server action `registerMedia` for external assets — always available.
- Grid UI with type-aware thumbnails + delete.

## 5. SEO Manager

Per-content SEO columns: `seoTitle`, `seoDescription`, `seoKeywords[]`, `ogImage`, `canonicalUrl`.
Edited via the reusable `<SeoFields>` block on every content form; consumed by the page-level
`buildMetadata()` / `generateMetadata` when pages render from the DB (`canonical` + OpenGraph + Twitter).

## 6. Version History (revisions) — `src/lib/revisions.ts`

- `snapshotRevision(entity, id, data)` writes a full JSON snapshot to `ContentRevision`
  (monotonic `version` per entity) on every content save.
- `/admin/posts/[id]/revisions` lists versions with one-click **restore** (`restoreRevision`),
  which snapshots the current state first, then writes the historical data back.
- Pattern generalises to Project/CaseStudy/Page (same helper + `MODEL_BY_ENTITY` map).

## 7. Activity Logs (audit trail) — `src/lib/activity.ts`

- `logActivity({action, entity, entityId, summary, metadata})` appends to `ActivityLog`
  (`CREATE/UPDATE/DELETE/PUBLISH/ARCHIVE/RESTORE/LOGIN`), attributed by user email.
- Called from every mutating server action; viewable at `/admin/activity` (last 200) and
  surfaced on the dashboard feed. Best-effort — never blocks the operation.

## 8. Dashboard Analytics — `/admin`

Live counts (posts, projects, leads, unread contacts, pending meetings), **posts-by-status**
breakdown (`groupBy`), recent activity feed, and recent leads. All reads are `safe()`-guarded
so the dashboard renders even without a database.

## 9. Architecture notes

- **Rendering:** all `/admin/*` routes are `force-dynamic` (live DB + session); never prerendered.
- **Guarding:** edge `middleware.ts` redirects unauthenticated `/admin` → login; the admin layout
  re-verifies via `auth()`; each server action re-checks RBAC (defence in depth).
- **Safety:** `safe()` wraps reads (DB-or-empty), `persist()` wraps public form writes,
  `logActivity`/`snapshotRevision` are best-effort — the app runs with or without a database.
- **Data model:** `prisma/schema.prisma` — 20+ models, enums for Role/ContentStatus/MediaType/
  ActivityAction/LeadStatus/MeetingStatus. Run `db:generate → db:push → db:seed`.

## 10. Extending

- **DB-backed public pages:** swap `src/data/*` reads for `db.*` queries filtered by live status, with ISR.
- **Multi-user:** add `@auth/prisma-adapter`, seed `User` rows with `passwordHash` (bcrypt) + role; the RBAC matrix already supports all four roles.
- **New entity:** add the model → a `save*/delete*` action (with `requirePermission` + `logActivity`) → a form + list/new/[id] pages → a sidebar entry keyed to a `visibleSections` resource.

## 11. Domains module (admin)

- **Resource:** `domains` in `src/lib/rbac.ts`
  - `ADMIN` / `SUPER_ADMIN`: `domains:*` (orders, pricing, fulfillment)
  - `EDITOR`: `domains:read`, `domains:update` (queue + status changes, no pricing CRUD)
- **Sidebar** (`admin-shell.tsx`):
  - `Домэйн захиалга` → `/admin/domains/orders` (`visibleSections.domains`)
  - `TLD үнэ` → `/admin/domains/pricing` (`visibleSections.domainsManage` = `domains:manage`)
- **Guards:** list pages call `requirePermission("domains", "read"|"manage")`; mutations (PR 10) use `domains:update` / `domains:manage`.
- **Fulfillment states:** `PENDING_PAYMENT → PAID → FULFILLING → COMPLETED` (+ `CANCELLED`, `REFUNDED`, `EXPIRED`).
- **Note:** Admin domain routes are **exempt** from the public `domains_module_enabled` kill switch so in-flight orders can be fulfilled when the storefront is disabled.
