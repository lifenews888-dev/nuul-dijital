# Parliament News — deploy хийхийн өмнөх шалгах жагсаалт

Хэнд: parlamentnews.mn-ийг байршуулах инженер / үйлдлийн хариуцагч.
Эх сурвалж: `docs/superpowers/specs/2026-11-25-parliament-news-platform-design.md`,
1-р шатны хяналтын дүн.

Мөр бүрийг гараар хийж, батлагдсаныг нь тэмдэглэнэ. Гүйцэд болоогүй мөртэй
нээлт гаргахгүй.

## 1. Өгөгдлийн сан

- [ ] **Parliament News нь ТУСДАА Supabase project дээр.** `NEWS_DATABASE_URL`,
      `NEWS_DIRECT_URL` нь nuul.mn-ийн `DATABASE_URL`-аас өөр project байна.
      Мэдээний контент nuul.mn-ийн захиалга, төлбөрийн өгөгдөлтэй нэг санд
      байрлахгүй.
- [ ] **`prisma db push`-ийг зөвхөн мэдээний схем дээр:**
      `cd packages/db-news && pnpm db:push`. nuul.mn-ийн `packages/db` дээр
      энэ төслийн улмаас push хийх шаардлага байхгүй.
- [ ] **`--accept-data-loss` тугийг хэзээ ч хэрэглэхгүй.** Prisma өгөгдөл
      устгах өөрчлөлт санал болговол тэнд зогсож, шалтгааныг тогтооно.
- [ ] **`migrate dev` ажиллуулахгүй.** Репод `prisma/migrations/` байхгүй тул
      `migrate dev` нь өгөгдлийн санг reset хийхийг санал болгоно.
- [ ] Хоосон биш өгөгдлийн сан дээр ямар ч схемийн өөрчлөлт хийхээс өмнө
      **нөөц хуулбар** авсан (Supabase → Database → Backups, эсвэл
      `pg_dump`). Нөөцөө буцааж сэргээж үзсэн.
- [ ] Өдөр бүрийн автомат нөөц хуулбар өөр газар хуулагддаг болсон.

## 2. Нэвтрэлт ба нууцлал

- [ ] **`NEXTAUTH_SECRET` нь nuul.mn-ийнхээс ӨӨР.** Хоёр апп нэг секрет
      хуваалцахгүй: домэйн хооронд cookie гардаггүй ч секретийг зориудаар
      салгана, санамсаргүй давхцлаар биш.
- [ ] `NEXTAUTH_URL` нь `https://parlamentnews.mn`.
- [ ] Супер админыг `ADMIN_EMAIL` (мөн сонголттой `ADMIN_PASSWORD`)-аар
      `cd packages/db-news && pnpm db:seed`-ээр үүсгэсэн. Автоматаар зохиосон
      нууц үг зөвхөн терминал дээр нэг удаа хэвлэгдэнэ — тэндээсээ хуулж,
      нэвтэрсний дараа сольсон.
- [ ] Редакцын хэрэглэгч бүр `TenantMember` бичлэгтэй. Бичлэггүй хэрэглэгч
      эрхгүй (`null`) — энэ нь зориудын шийдэл, тестээр тогтоогдсон.
- [ ] Редактор, админд 2FA (2-р шат) хэзээ орохыг шийдсэн.

## 3. Tenant тусгаарлалт

- [ ] **`pnpm --filter @nuul/news test:db` ногоон.** Энэ бол нэг байгууллагын
      мэдээ нөгөөд харагдахгүй гэдгийн гол баталгаа. DB хүрэхгүй үед
      ажиллуулах боломжгүй тул нээлтээс өмнө ЗААВАЛ нэг удаа ажиллуулна.
      (2026-11-25: локал Postgres 16 дээр 3/3 ногоон. `scopeWhere`-ээс tenant
      шүүлтийг зориуд хассан мутаци нь 3 тестийн 2-ыг улаан болгосон тул
      тестүүд хоосон ногоон биш, бодит баталгаа гэдэг нь батлагдсан.)
- [ ] `pnpm --filter @nuul/news lint` ногоон — `$queryRaw`/`$executeRaw`
      хориотой (түүхий SQL нь tenant шүүлтээс мултарна).
- [ ] Шинэ `pn_` модель схемд нэмсэн бол `lib/tenant-db.ts`-ийн
      `TENANT_MODELS`-д БАС нэмсэн (жагсаалтад байхгүй модель шүүлтгүй үлдэнэ).
- [ ] `NEWS_TENANT_SLUG` зөв (эсвэл тохируулаагүй → `parlament`), тэр slug-тай
      `Tenant` мөр seed-ээр үүссэн. Нэг сайт тул домэйноор tenant хайхгүй.
- [ ] Хожим хоёр дахь сайт нэмэх шийдвэр гарвал, нийтийн хуудас кэшлэхээсээ
      ӨМНӨ tenant-ыг замын параметр болгоно (`/_t/<slug>/...` rewrite): Next нь
      Full Route Cache-ийг Host-оор салгадаггүй тул нэг сайтын HTML нөгөөд
      үйлчилж болно.

## 4. Vercel

- [ ] `apps/parliament-news` нь **тусдаа Vercel project**. nuul.mn-ийн
      одоогийн project-ийн тохиргоо хөндөгдөөгүй.
- [ ] Build command нь мэдээний client-ыг үүсгэдэг:
      `cd packages/db-news && pnpm exec prisma generate --schema=prisma/schema.prisma && cd ../../apps/parliament-news && pnpm exec next build`
      (`packages/db-news/generated/` нь git-д ордоггүй).
- [ ] `pnpm-lock.yaml` commit хийгдсэн. Vercel `pnpm install`-ийг
      `--frozen-lockfile`-тай ажиллуулдаг тул lockfile хоцрогдвол **nuul.mn-ийн
      deploy ч унана**.
- [ ] Env хувьсагчид Vercel дээр тавигдсан: `NEWS_DATABASE_URL`,
      `NEWS_DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
      `BLOB_READ_WRITE_TOKEN`.
      Vercel дээр `.env` файл байхгүй — env нь dashboard-аас ирнэ.
      `next.config.js` нь `override: false`-тэй уншдаг тул dashboard-ийн
      утгыг дарж бичихгүй. Аль нэг нь тавигдаагүй бол апп 500 буцаана
      (`/api/trpc/health`-ээр deploy-ийн дараа ШУУД шалга).
- [ ] `parlamentnews.mn` ба `www.parlamentnews.mn` домэйн project-д холбогдсон.
      (`Tenant.domains` нь лавлагаа болж схемд байгаа — одоо tenant хайхад
      хэрэглэгддэггүй.)

## 5. Нээлтийн өмнө

- [ ] Cloudflare: WAF, DDoS, rate limit.
- [ ] Ачааллын тест (чуулганы шууд дамжуулалтын үеийн оргил).
- [ ] `robots.txt`, `sitemap.xml`, `rss.xml` зөв гарч байгаа (2-р шат).
- [ ] Мэдээ хуваалцахад Facebook дээр зураг, гарчиг зөв (Open Graph, 2-р шат).
- [ ] Хэрэв захиалагч байгууллага гарч ирсэн бол «платформ нь Нүүл
      Дижиталынх, өгөгдөл нь захиалагчийнх» гэдгийг бичгээр тохирсон.
- [ ] Hosting, Cloudflare, Vercel, Supabase-ийн зардлыг хэн хариуцахыг
      тохирсон.
