# Parliament News 1-р шат — гүйцэтгэлийн бүртгэл (ledger)

Хэнд: энэ төслийг дараа үргэлжлүүлэх инженер.

Төлөвлөгөө: `docs/superpowers/plans/2026-11-25-parliament-news-phase1-foundation.md`
Дизайн (эрх бүхий): `docs/superpowers/specs/2026-11-25-parliament-news-platform-design.md`

Доорх нь 1-р шатыг гүйцэтгэх үед гарсан шийдвэрүүдийн эх бүртгэл. `Ruling:`
гэсэн мөр бүр нь төлөвлөгөөнөөс зөрсөн, эсвэл төлөвлөгөө хариулаагүй зүйлийг
хэрхэн шийдсэн, яагаад, буруу бол ямар өртөгтэй болохыг тэмдэглэнэ.
`minor (deferred)` мөрүүд нь хяналтаар гарсан, зориудаар хойшлуулсан жижиг
асуудлууд — 2-р шатны үед дахин харах зүйлсийн жагсаалт.

Энэ файл бол гүйцэтгэлийн үеийн scratch бүртгэлийн хуулбар. Build, тестийн
log-ууд нь үнэ цэнгүй тул хадгалаагүй.

---

# SDD ledger — plan: docs/superpowers/plans/2026-11-25-parliament-news-phase1-foundation.md

Spec: docs/superpowers/specs/2026-11-25-parliament-news-platform-design.md (read)
Executor: inline (Native), chosen by human partner.

Setup: Ruling: no git worktree; branch feat/parliament-news-foundation in the main tree
 — the untracked root .env (DATABASE_URL) and the installed pnpm node_modules live only
 in this tree, and Task 5 DB tests plus Task 10 seed need them; a fresh worktree would
 require a full reinstall and copying credentials. Cost if wrong: this working tree is
 shared with other work on master (master itself untouched; commits land on the branch).
Setup: baseline — repo has no test suite at all (no vitest/jest anywhere); Task 1
 introduces vitest. Baseline verification is therefore Task 1 Step 2 (pnpm install + build).
Setup: baseline commit 25492cc adds docs/ and the previously-untracked apps/parliament-news/
 (site-v2, prototype, README) so later task commits stay clean.

Pre-flight (Interfaces blocks):
- T2 -> T3,T4,T5,T6,T7,T8: Tenant/TenantMember/NewsRole. OK, consistent.
- T3 -> T4,T5,T6,T9: NewsPost/NewsStatus/TenantSetting. OK.
- T4 -> T5,T10: parliament models in TENANT_MODELS and seed. OK.
- T5 -> T8,T9: forTenant/TenantClient. OK; T5 blocks upsert and T9 already uses
  findFirst + create/updateMany.
- T7 -> T8: getTenantByHost feeds the tRPC context. OK.
- T6 -> T8: Ruling: T8 does NOT import T6. T8 only needs its own requireRole; T6's
  editorial helpers are consumed by the Phase 2/3 routers. Keeping the import out avoids
  a dead dependency. Cost if wrong: a later router must import T6 itself (one line).
- T9 -> T10: Ruling: the seed hardcodes the four settings defaults as literal JSON
  instead of importing T9's zod schemas — packages/db cannot import from
  apps/parliament-news (separate package, no dependency, and adding one would make the
  db package depend on the app). T9's tests pin the same values, so drift is visible.
  Cost if wrong: defaults could drift between seed and schema; mitigated by T9 tests.
- T1 -> (nothing in this plan): slug helpers are consumed by the Phase 2/3 CMS. Tested
  standalone here.
Task 1: complete (commits 25492cc..6385d09, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.23s[2m (transform 39ms, setup 27ms, collect 26ms, tests 4ms, environment 0ms, prepare 782ms)[22m)

Task 2: Ruling: the plan's verify command "pnpm exec prisma validate" fails with
 P1012 (Environment variable not found: DIRECT_URL) — it must be wrapped in dotenv like
 every other script in packages/db: "pnpm exec dotenv -e ../../.env -- prisma validate
 --schema=prisma/schema.prisma". Applied to Tasks 2-4. Cost if wrong: none, same check.
Task 2: Ruling: do NOT run "pnpm db:migrate" (prisma migrate dev) anywhere in this plan.
 packages/db has no prisma/migrations directory — this project manages schema with
 "prisma db push" (root package.json db:push, vercel.json runs only generate). migrate dev
 against a push-managed database offers to RESET it, which would destroy the live nuul.mn
 data. Schema tasks are therefore verified with validate + generate, and the DB is updated
 with "pnpm db:push" (no --accept-data-loss). Cost if wrong: no migration history for the
 new tables; db push keeps the project's existing convention.
Task 2: Ruling: BLOCKED on applying the schema to a database. The DATABASE_URL and
 DIRECT_URL in the untracked root .env point at Supabase pooler
 aws-1-ap-northeast-2.pooler.supabase.com (DNS resolves, 43.202.154.182) but the pooler
 rejects the project ref: "FATAL: (ENOTFOUND) tenant/user postgres.njdbneiinmtpyudbxepb
 not found" — the project is deleted/paused or the local .env is stale (Vercel may hold a
 newer URL). Docker is installed (29.8.0) but its daemon is not running, so no local
 throwaway Postgres either. Decision: execute every task that does not need a live DB,
 and defer exactly three things — db push (Tasks 2-4), the Task 5 DB isolation tests, and
 the Task 10 seed run. Nothing is marked verified that was not run. Cost if wrong: the
 schema could fail on first push (mitigated: validate + generate both pass).
Task 2: complete (commits 6385d09..0963400, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.43s[2m (transform 51ms, setup 32ms, collect 35ms, tests 6ms, environment 0ms, prepare 261ms)[22m)
Task 3: complete (commits 0963400..6e26066, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.35s[2m (transform 47ms, setup 30ms, collect 28ms, tests 4ms, environment 0ms, prepare 784ms)[22m)
Task 4: Ruling: a sed insert matched the identical relation line in both Tenant and
 NewsPost, so "bill Bill?" landed in Tenant too and prisma validate caught it as an
 ambiguous relation; removed the Tenant copy (line 843). No cost — caught by validate
 before generate, both sides of the Bill relation are now single.
Task 4: complete (commits 6e26066..bab3d02, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.37s[2m (transform 50ms, setup 34ms, collect 35ms, tests 5ms, environment 0ms, prepare 895ms)[22m)
Task 5: Ruling: split the task's tests in two. lib/tenant-db.test.ts (5 tests) proves the
 guard logic offline — the extension throws before query() runs, so no database is needed;
 these went RED (module missing) then GREEN. lib/tenant-db.db.test.ts holds the plan's 3
 isolation tests unchanged; it cannot run (PrismaClientInitializationError, FATAL ENOTFOUND
 tenant/user postgres.njdbneiinmtpyudbxepb, log: task5-dbtest.log). The package "test"
 script now excludes **/*.db.test.ts and a new "test:db" script runs them, so the default
 suite is honestly green while the DB suite stays visible and unexecuted. Cost if wrong:
 where-injection for findMany/updateMany is unproven until someone runs test:db against a
 real database — this is the plan's Review Focus 1 and must be run before launch.
Task 5: complete (commits bab3d02..ebd1fa8, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.47s[2m (transform 84ms, setup 58ms, collect 136ms, tests 13ms, environment 0ms, prepare 295ms)[22m)
Task 6: complete (commits ebd1fa8..38399f1, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.44s[2m (transform 116ms, setup 88ms, collect 205ms, tests 21ms, environment 0ms, prepare 2.57s)[22m)
Task 7: Ruling: parseHost moved from lib/tenant.ts into its own pure lib/host.ts, and
 lib/tenant.ts re-exports it so the plan's produced interface still holds. Reason: the plan
 had middleware.ts importing from lib/tenant.ts, which also imports next/headers and
 next/navigation — server-component-only modules that must not enter the Edge middleware
 bundle. The brief's parseHost tests now live in lib/host.test.ts. Cost if wrong: one extra
 small file; the interface callers see is unchanged.
Task 7: Ruling: middleware always overwrites (or deletes) the inbound x-tenant-host header
 instead of only setting it. The plan said "set"; a client could otherwise send
 x-tenant-host for another tenant and read its content, since lib/tenant trusts that header.
 Cost if wrong: none — strictly tighter than the plan.
Task 7: complete (commits 38399f1..9f40529, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.42s[2m (transform 140ms, setup 121ms, collect 261ms, tests 23ms, environment 1ms, prepare 3.22s)[22m)
Task 8: Ruling: added bcryptjs ^3.0.3 and @types/bcryptjs ^3.0.0 to @nuul/news. The plan's
 dependency list was copied from apps/web but omitted bcryptjs, which lib/auth.ts needs for
 compare(); vitest failed to resolve it. Versions match apps/web. Cost if wrong: none.
Task 8: complete (commits 9f40529..94a6d33, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.85s[2m (transform 198ms, setup 149ms, collect 830ms, tests 25ms, environment 1ms, prepare 724ms)[22m)
Task 9: Ruling: added tenantData<T>(data) to lib/tenant-db.ts and used it for the
 tenantSetting create. Prisma's create input requires tenantId (verified: removing the cast
 fails the build with "Property 'tenant' is missing"), but forTenant injects it at runtime.
 A bare "as never" would hide that; the named helper documents the gap in one place and
 every future router can use it. Cost if wrong: a create that bypasses forTenant would lose
 the compile-time tenantId requirement — the runtime extension still rejects a foreign
 tenantId, and findUnique/update/delete stay blocked.
Task 9: Ruling: footerSchema rejects non-http(s) schemes outright. The artifact's own check
 (admin.html saveSet) would turn "javascript:alert(1)" into "https://javascript:alert(1)"
 and store it, because it only prefixes and then regex-tests. The brief's test demanded "",
 so the normalizer drops any other scheme before prefixing. Cost if wrong: none.
Task 9: complete (commits 94a6d33..ebb4484, tests: pnpm --filter @nuul/news test → [2m   Duration [22m 1.91s[2m (transform 267ms, setup 177ms, collect 1.09s, tests 43ms, environment 1ms, prepare 4.98s)[22m)

Task 10: INCOMPLETE (blocked, not complete). Step 1 done: prisma/seed-news.ts written and
 the db:seed:news script added; tsc --noEmit --strict on the file passes; running it loads
 the module, passes the ADMIN_EMAIL guard and reaches prisma.tenant.upsert, failing only on
 FATAL ENOTFOUND for the Supabase project. Steps 2-4 (run the seed, verify tenant/8
 categories/4 settings/1 member, re-run for idempotency) were NOT performed — they need a
 reachable database. Task 10 Step 5 partially done: news suite 38/38 green and
 "pnpm --filter @nuul/web build" exits 0 and compiles, so the schema additions did not
 break nuul.mn (plan anti-goal).
Task 10: Ruling: the seed hardcodes the four settings defaults (see the T9 -> T10 pre-flight
 ruling) and requires ADMIN_EMAIL rather than defaulting to any address, so no account is
 ever created for an address the operator did not name. ADMIN_PASSWORD is optional; without
 it the script generates a 16-char password and prints it once to the terminal only — never
 to a file, a log or this transcript. Cost if wrong: the operator must copy the password
 from their terminal at seed time.

Final review: fresh reviewer (subagent, opus) over review-25492cc..c9c7da6.diff.
 Verdict: not ready to merge. 4 Critical, 7 Important, 11 Minor, 8 declined-to-judge.
 I verified C1, C3 and C4 myself before acting (cat -A on the matcher line, grep on the
 seed, git status on the lockfile); all three were real. Re-graded by effect: no finding
 moved between Critical and Important, and no Minor was promoted, because every Minor
 needs code Phase 1 does not ship yet.

Final: fixed C1 middleware matcher inert (only / matched) - test "middleware matcher" in
 lib/host.test.ts RED->GREEN, suite 53/53. While fixing it I found a second defect the
 reviewer could not see: Next evaluates "export const config" statically, so an imported
 MIDDLEWARE_MATCHER constant was unresolvable and Next silently fell back to matching
 every path (.next/server/middleware-manifest.json showed originalSource /:path*, regexp
 ^/.*$). The matcher is now an inline literal and the test reads config.matcher[0] from
 middleware.ts itself, so the value Next uses is the value under test; the rebuilt
 manifest shows originalSource /((?!_next/).*). The new matcher excludes only _next/ -
 the plan excluded every path containing a dot, which would have skipped every nested
 tRPC route and /rss.xml.
Final: fixed C2 client-controlled tenant header - lib/host.ts pickTenantHost plus 3 tests
 RED->GREEN. Tenant now resolves from the real Host in both createContext and
 requireTenant; x-tenant-host is honored only when NODE_ENV is not production. Tenant
 identity no longer depends on the matcher being correct.
Final: fixed C3 seed granting nuul.mn platform admin - removed role: "ADMIN" from
 prisma/seed-news.ts, so the user defaults to CLIENT and editorial authority comes only
 from TenantMember (spec section 5.3). No automated test: packages/db has no test runner
 and the script cannot run without a database. Verified by grep (0 occurrences) and a
 clean tsc --noEmit --strict on the file.
Final: fixed C4 uncommitted pnpm-lock.yaml - committed in this pass. Without it Vercel
 (installCommand "pnpm install", CI implies --frozen-lockfile) fails with
 ERR_PNPM_OUTDATED_LOCKFILE and the existing nuul.mn deploy breaks on merge.
Final: fixed I1 createManyAndReturn unscoped - test in lib/tenant-db.test.ts RED->GREEN
 (before the fix the call reached Prisma, which proved the gap). Folded into the
 createMany branch.
Final: fixed I2 fail-open model list - TenantMember and BillStage added to TENANT_MODELS;
 scopeWhere extracted and tested RED->GREEN. BillStage now carries its own tenantId
 (see I3) so it scopes like any other model instead of relying on reaching it through
 Bill. A comment above TENANT_MODELS states that a new pn_ model must be added here.
Final: fixed I3 relation ids never tenant-checked - every child relation is now a
 composite foreign key referencing [tenantId, id]: NewsMedia, NewsComment,
 NewsSlugRedirect, BillStage, and also the optional NewsPost.category,
 NewsCategory.parent and Bill.post. Added @@unique([tenantId, id]) to NewsPost,
 NewsCategory and Bill, and replaced Bill.postId @unique with @@unique([tenantId,
 postId]). I expected Prisma to reject a composite FK that mixes a required tenantId with
 an optional id and tested that assumption rather than trusting it - Prisma accepts them,
 so the database now enforces what the reviewer said only application code could.
 Verified by prisma validate, prisma generate and both app builds. Tables are still
 empty, so this costs nothing now and would be expensive later.
Final: fixed I4 editableSections dropped ownership and state gating -
 editableSectionsFor added to lib/permissions.ts implementing admin.html secsFor exactly
 (reporter/contributor only own posts in DRAFT or RETURNED, reviewer only REVIEW or
 APPROVED or new, media never PUBLISHED), 5 tests RED->GREEN. The role-only
 editableSections stays for UI hints.
Final: fixed I5 publish freeze keyed only off publishedAt - nextSlug takes an optional
 status and freezes when status is PUBLISHED as well, 2 tests RED->GREEN.
Final: fixed I6 taken contract undocumented - docstrings on uniqueSlug and nextSlug state
 that taken is the tenant post slugs plus NewsSlugRedirect.fromSlug. Documentation only,
 no test.
Final: Ruling: I7 (requireTenant calls headers(), so public pages cannot use the Full
 Route Cache) is not fixed here and is carried into the Phase 2 plan as an explicit
 decision. Phase 1 ships no public pages, and the middleware-rewrite scheme
 (/_t/<slug>/...) would be speculative with no routes to test it against. The trap is now
 documented in the requireTenant docstring: a page that avoids tenant reads and sets
 revalidate gets a pathname-keyed cache that Next does not vary by Host, which would
 serve one tenant HTML to another. Cost if wrong: Phase 2 reworks the tenant plumbing
 once, which must happen before any public route is cached.

Final: minor (deferred): unstable_cache JSON round-trip returns Tenant.createdAt and
 updatedAt as strings while typed Date; nothing in Phase 1 reads them.
Final: minor (deferred): a null or inactive tenant is cached for 300s, so adding a domain
 or deactivating a tenant takes up to 5 minutes to take effect.
Final: minor (deferred): the single shared cache tag pn-tenant invalidates all tenants at
 once.
Final: minor (deferred): the extension mutates the caller args object (next.where,
 next.data) instead of a shallow copy.
Final: minor (deferred): forTenant calls prisma.$extends per request; could be memoized
 per tenantId.
Final: minor (deferred): $queryRaw and $executeRaw are client-level and not intercepted,
 so the "every content query goes through this" docstring overstates.
Final: minor (deferred): seed domains include www.parlamentnews.mn and parlament.localhost
 which parseHost can never produce (www. is stripped, *.localhost becomes a slug).
Final: minor (deferred): NewsMedia has no @@index([tenantId, ...]) although every query
 now filters on tenantId.
Final: minor (deferred): footer social links upgrade http:// to https:// while fxApi
 rejects http:// outright - two policies for one input class; and httpsOnly accepts
 internal hostnames, which matters when Phase 4 fetches fxApi server-side.
Final: minor (deferred): uniqueSlug can return 82 characters when base is exactly 80.
Final: minor (deferred): middleware startsWith("/studio/signin") also exempts
 /studio/signin-anything from the auth gate; no such route exists yet.
Final: minor (deferred): settings putSetting findFirst-then-create races on first
 concurrent write; the unique index keeps integrity but surfaces a raw P2002.

Final: Ruling: SUPER and CHIEF may skip stages (DRAFT->PUBLISHED is in their all-pairs
 table). An editor-in-chief publishing a draft in one action is normal newsroom
 authority, and the spec gives chief "бүх мэдээг ... нийтлэх". Cost if wrong: a chief can
 publish without a second pair of eyes.
Final: Ruling: canTransition(role, X, X) is false for every role, SUPER included. A save
 that does not change status must not call canTransition; Phase 3 routers check it only
 on an actual transition. Cost if wrong: a router written the other way rejects ordinary
 saves - caught the first time anyone saves a draft.
Final: Ruling: REVIEWER keeps the pub section, exactly as admin.html SECS has it, while
 the transition table still blocks publishing. A reviewer can set channel checkboxes but
 cannot publish. Cost if wrong: a reviewer edits social channels on someone elses post.
Final: Ruling: REPORTER has no REVIEW->DRAFT withdrawal path, matching the artifact. Once
 submitted, a reporter asks a reviewer to return it. Cost if wrong: an extra round trip
 in the newsroom; add the transition in Phase 3 if they ask for it.
Final: Ruling: test:db stays out of the default test script. The repo has no CI, so the
 isolation suite runs when a human runs it; it is listed in the handover as a launch
 blocker. Cost if wrong: the strongest isolation evidence stays unexecuted - this is the
 single most important thing to run once the database is reachable.
Final: Ruling: the second Vercel project and vercel.json are out of Phase 1 scope by the
 plan, so the news app has no deploy configuration yet. Cost if wrong: nothing until
 someone tries to deploy it.
Final: Ruling: Mongo-only findRaw and aggregateRaw are left uncovered by the extension -
 unreachable on Postgres.
Final: Ruling: NEXTAUTH_SECRET is shared between the two apps today. Cookies do not cross
 nuul.mn and parlamentnews.mn and authorization comes from TenantMember, so I see no
 escalation path, but the deployment owner should set separate secrets deliberately
 rather than by accident. Cost if wrong: a forged session cookie from one app would be
 accepted by the other, where it still grants no editorial role.

Final: Ruling: this plan workspace is NOT deleted, against the skill default. Task 10 is
 incomplete and blocked on the database, so this ledger is the resume point for whoever
 runs db push, test:db and the seed. Delete it once those three are done. Cost if wrong:
 a stale scratch directory under .superpowers (git-ignored).

Post-review round (human partner decisions, 2026-11-25):
Final: regraded minor -> CRITICAL and fixed: /studio/signin-anything bypassed the auth
 gate. needsStudioAuth() in lib/host.ts matches on path boundaries, 4 tests RED->GREEN,
 suite 57/57. The partner was right that an unauthenticated route into the newsroom is a
 security defect, not polish.
Final: Ruling (partner decision): Parliament News moves to its OWN database. 17 pn_ tables
 left packages/db for the new packages/db-news package with its own datasource
 (NEWS_DATABASE_URL / NEWS_DIRECT_URL) and its own generated client at
 packages/db-news/generated/client (gitignored). nuul.mn's schema is back to 36 models with
 zero pn_ references, so no db push against the live nuul.mn database is needed at all.
 Consequence I surfaced before doing the work and then carried: the shared User table is
 gone, so editorial accounts live in the news database as pn_users and there is no shared
 login with nuul.mn. That also closes the whole C3 class of defect permanently. Session no
 longer carries a platform role; authorization is TenantMember only. Cost if wrong:
 two databases to back up and two Prisma clients to generate at deploy.
Final: Ruling: ESLint added to the news app (eslint 8 + @typescript-eslint/parser, .eslintrc.json)
 with no-restricted-syntax banning $queryRaw/$queryRawUnsafe/$executeRaw/$executeRawUnsafe.
 Verified by a probe file that produced the error, then removed; lint is green on real code.
 Chose a minimal eslintrc over next/core-web-vitals to avoid pulling eslint-config-next for
 one rule. Cost if wrong: the app has no other lint rules yet.
Final: Ruling: I7 is now the FIRST task of the Phase 2 plan (spec section 6), not a deferred
 note: middleware rewrite to /_t/<slug>/..., with tests proving per-tenant cache separation,
 before any public page is cached.
Final: Ruling: appended commented NEWS_DATABASE_URL / NEWS_DIRECT_URL placeholders to the
 untracked root .env so prisma generate works offline. The values are templates
 (USER:PASSWORD@HOST), not credentials, and the partner replaces them. Cost if wrong: a
 stale commented block in .env.
Final: added apps/parliament-news/DEPLOY-CHECKLIST.md covering the partner's required items:
 separate NEXTAUTH_SECRET, test:db green before launch, never --accept-data-loss, backup
 before any schema change, no migrate dev, the Vercel generate step, and the lockfile.

Still blocked (now against the NEW database, not nuul.mn's):
  cd packages/db-news && pnpm db:push
  pnpm --filter @nuul/news test:db
  cd packages/db-news && ADMIN_EMAIL=<email> pnpm db:seed
 These need a real Supabase project in NEWS_DATABASE_URL. Creating that project is the
 partner's action (external account); I cannot and did not create it.

Task 10: complete (2026-11-25, local Postgres 16 @127.0.0.1:5447). db push -> 18 pn_* tables;
 test:db -> 3/3 green, mutation-verified (scopeWhere filter removed -> 2/3 red); db:seed ->
 parlament tenant, 8 categories, 4 settings, 1 SUPER member. Phase 1 plan fully executed.
Final: fixed root .env not reaching the app (Next reads .env from the app dir only) --
 lib/env.test.ts RED->GREEN, suite 56/56. Commit 58ac710.
