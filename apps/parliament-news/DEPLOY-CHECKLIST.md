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

- [ ] **`NEWS_NEXTAUTH_SECRET` тавигдсан** (`NEXTAUTH_SECRET` БИШ).
      nuul.mn-ийнхээс өөр утга. Тавигдаагүй бол апп асахдаа чангаар
      унана (`lib/auth-env.ts`) — чимээгүй хуваалцахаас дээр.
      Cookie нь `pn-auth.` угтвартай, production-д `__Secure-`.

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
      `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SITE_URL`.
      `NEXT_PUBLIC_SITE_URL` нь `https://parlamentnews.mn` — canonical,
      Open Graph, sitemap, RSS бүгд үүнээс бүтнэ. Буруу бол хуваалцсан
      холбоос localhost руу чиглэнэ.
      Vercel дээр `.env` файл байхгүй — env нь dashboard-аас ирнэ.
      `next.config.js` нь `override: false`-тэй уншдаг тул dashboard-ийн
      утгыг дарж бичихгүй. Аль нэг нь тавигдаагүй бол апп 500 буцаана
      (`/api/trpc/health`-ээр deploy-ийн дараа ШУУД шалга).
- [ ] `parlamentnews.mn` ба `www.parlamentnews.mn` домэйн project-д холбогдсон.
      (`Tenant.domains` нь лавлагаа болж схемд байгаа — одоо tenant хайхад
      хэрэглэгддэггүй.)

## 5. Нээлтийн өмнө

- [ ] Cloudflare: WAF, DDoS, rate limit.
- [ ] **Хоцролт Монголоос хэмжсэн.** Vercel-ийн хамгийн ойрын edge нь Хонг Конг
      (`hkg1`) тул Улаанбаатараас ~385 мс — `montsame.mn` дээр хэмжсэн тоо.
      Дотоодод байршсан `ikon.mn` 93 мс, `gogo.mn` 68 мс. Нээлтийн дараа
      шалгах:
      ```bash
      for i in 1 2 3; do curl -s -o /dev/null -w '%{time_starttransfer}\n' \
        https://parlamentnews.mn; done
      ```
      300 мс-ээс дээш бол Cloudflare-ийн HTML кэшийг ULN дээр тавих шийдвэрийг
      гарга (Cloudflare-д Улаанбаатарт POP байна: `colo=ULN`, `loc=MN`).
      Анхаар: Cloudflare-ийг зүгээр урд тавих нь хүрэлцэхгүй —
      `cf-cache-status: HIT` болтол HTML кэшлэх дүрэм бичнэ, мөн нийтлэхэд
      Vercel-ийн ISR ба Cloudflare хоёуланг цэвэрлэх purge шаардлагатай.
- [ ] **Нийтлэлийн хуудасны биет хэмжээ зорилтод нь байна:**
      HTML < 100 KB (ikon.mn 59 KB, news.mn 900 KB), `<script>` < 12
      (ikon.mn 5, gogo.mn 30), гол зураг < 120 KB WebP
      (ikon.mn 296 KB, gogo.mn 335 KB, news.mn 466 KB — хэн ч WebP үйлчилдэггүй).
      ```bash
      curl -s https://parlamentnews.mn/news/<slug> | wc -c
      curl -s https://parlamentnews.mn/news/<slug> | grep -c '<script'
      curl -s -o /dev/null -w '%{content_type} %{size_download}\n' \
        -H 'Accept: image/avif,image/webp,image/*' '<гол зургийн _next/image хаяг>'
      ```
- [ ] Ачааллын тест (чуулганы шууд дамжуулалтын үеийн оргил).
- [ ] `robots.txt`, `sitemap.xml`, `rss.xml` зөв гарч байгаа. Parser-ээр шалга,
      нүдээр биш:
      ```bash
      curl -s https://parlamentnews.mn/rss.xml > /tmp/r.xml
      python -c "import xml.dom.minidom as m; m.parse('/tmp/r.xml'); print('OK')"
      ```
- [ ] **ЗААВАЛ: Open Graph зураг үнэхээр үүсч байгааг deploy-ийн дараа шалга.**
      `next/og` (Satori) нь Windows дээр ажиллахгүй — Next 14.2.35-ийн багцалсан
      `@vercel/og` нь өөрийн нөөц фонтоо `.\file:\C:\...` гэсэн хүчингүй URL-ээр
      ачаалж `ERR_INVALID_URL` өгдөг. Linux (Vercel) дээр энэ зам өөр тул
      асуудал гарах ёсгүй, ГЭХДЭЭ хөгжүүлэлтийн явцад ТУРШИГДААГҮЙ.
      ```bash
      curl -s -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' \
        https://parlamentnews.mn/news/<slug>/opengraph-image
      ```
      Хүлээгдэх: `200 image/png` ба 0-ээс их хэмжээ. Хоёр тохиолдлыг хоёуланг
      нь шалга: **зурагтай** мэдээ ба **зураггүй** мэдээ (сүүлийнх нь палитрын
      геометрээр эргэнэ). 500 эсвэл хоосон бол `app/news/[slug]/opengraph-image.tsx`
      ажиллахгүй байна гэсэн үг — хуваалцсан холбоос зураггүй гарна.
- [ ] Мэдээ хуваалцахад Facebook дээр зураг, гарчиг зөв (Open Graph).
      Шалгах: developers.facebook.com/tools/debug/ дээр нэг нийтлэлийн хаягаар.
- [ ] **`NewsArticle` JSON-LD нийтлэл бүрт байна.** Шалгасан 4 сайтаас gogo.mn
      (2) ба news.mn (1) л хийдэг, ikon.mn ба eagle.mn-д байхгүй — Google News,
      Discover-ийн rich result үүнээс хамаардаг.
- [ ] Хэрэв захиалагч байгууллага гарч ирсэн бол «платформ нь Нүүл
      Дижиталынх, өгөгдөл нь захиалагчийнх» гэдгийг бичгээр тохирсон.
- [ ] Hosting, Cloudflare, Vercel, Supabase-ийн зардлыг хэн хариуцахыг
      тохирсон.


---

## 6. 4-р шатны дараах нэмэлтүүд (2026-11-28)

### 6.1 Vercel project үүсгэх — тодорхой алхмууд

1. GitHub руу түлхэнэ (`master`). Энэ репо аль хэдийн холбогдсон.
2. Vercel → **Add New → Project** → энэ репог сонгоно.
3. **Root Directory = `apps/parliament-news`**. Энэ нь чухал: ингэснээр
   `apps/parliament-news/vercel.json` нь ЗӨВХӨН энэ project-д үйлчилнэ,
   nuul.mn-ийн тохиргоог хөндөхгүй. (Репогийн эхэд `vercel.json` тавьбал
   хоёр project хоёулаа түүнийг уншина.)
4. «Include source files outside of the Root Directory» = **ON**
   (pnpm workspace тул `packages/db-news` хэрэгтэй).
5. Build command, region, толгой, cron бүгд `vercel.json`-д бичигдсэн —
   dashboard дээр давхар тохируулах шаардлагагүй.
6. Env хувьсагчдыг `apps/parliament-news/.env.example`-ийн дагуу
   dashboard дээр оруулна. **Нууц утгыг чат, repo, лог-д бүү оруул.**

### 6.2 Deploy-ийн ДАРААХ шалгалт

```bash
# 1. Апп асаж байна уу (env дутуу бол 500)
curl -s -o /dev/null -w '%{http_code}
' https://parlamentnews.mn/

# 2. Open Graph зураг — Windows дээр ХЭЗЭЭ Ч туршигдаагүй, энд л батлагдана
curl -s -o /dev/null -w '%{http_code} %{content_type} %{size_download}
'   https://parlamentnews.mn/news/<slug>/opengraph-image
# Хүлээгдэх: 200 image/png, 0-ээс их. Зурагтай БА зураггүй мэдээ хоёуланг шалга.

# 3. Хоцролт Монголоос
pnpm --filter @nuul/news check:load https://parlamentnews.mn 10 100
# p50 > 300мс бол Cloudflare-ийн HTML кэшийн шийдвэр (6.4-ийг үз)

# 4. RSS нь parser-аар уншигдана
curl -s https://parlamentnews.mn/rss.xml > /tmp/r.xml
python -c "import xml.dom.minidom as m; m.parse('/tmp/r.xml'); print('OK')"

# 5. Сошиал дараалал — нууцтай бол ажиллана, нууцгүй бол 404
curl -s -o /dev/null -w '%{http_code}
'   -H "Authorization: Bearer $SOCIAL_DISPATCH_SECRET"   https://parlamentnews.mn/api/social/dispatch
```

- [ ] Дээрх таван тушаал бүгд хүлээгдэж буй хариу өгсөн.
- [ ] Blob байршуулалт жинхэнэ токентой ажиллав (студид зураг оруулж үз).

### 6.3 Нөөц хуулбар

- [ ] Supabase-ийн автомат нөөц асаалттай, хадгалах хугацаа тохирсон.
- [ ] Нөөцийг нэг удаа ҮНЭХЭЭР сэргээж үзсэн. Сэргээгээгүй нөөц нь нөөц биш.
- [ ] Локал хөгжүүлэлтэд: `pnpm --filter @nuul/news db:backup` — схем
      өөрчлөхийн өмнө бүрт.

### 6.4 Cloudflare

- [ ] WAF, DDoS, bot хамгаалалт асаалттай.
- [ ] Нэвтрэлтийн зам (`/api/auth/*`) дээр нэмэлт rate limit дүрэм.
      Аппын дотоод хязгаар (цагт 10 буруу оролдлого) нь АРЫН ШУГАМ;
      Cloudflare нь урд нь зогсоох ёстой.
- [ ] Хэрэв p50 > 300мс бол: HTML кэшийн дүрэм бичиж `cf-cache-status: HIT`
      болтол тохируулна. Анхаар — нийтлэх үед Vercel-ийн ISR БА
      Cloudflare хоёуланг цэвэрлэх purge хэрэгтэй, эс бөгөөс шинэ мэдээ
      хуучин кэшний ард үлдэнэ.

### 6.5 Сошиал автомат нийтлэл

- [ ] `SOCIAL_DISPATCH_SECRET` тавигдсан; эс бөгөөс cron нь 404 авна.
- [ ] Vercel → Project → Cron Jobs дээр `/api/social/dispatch` 10 минут
      тутам ажиллаж байгаа нь харагдаж байна.
- [ ] Telegram: бот үүсгэж, сувагтаа админ болгосон; `TELEGRAM_BOT_TOKEN`,
      `TELEGRAM_CHAT_ID` тавигдсан. Нэг мэдээ нийтлээд сувагт очсоныг нүдээр
      шалгасан.
- [ ] Facebook/Instagram/YouTube/TikTok нь хараахан тохируулаагүй —
      дараалалд нь SKIPPED болж харагдана. Энэ нь АЛДАА БИШ. Токен орж
      ирэхэд `lib/social/stub.ts`-ийг жинхэнэ адаптераар солино.

### 6.6 Нээлтийн өмнөх эцсийн гүйлт

```bash
pnpm --filter @nuul/news test        # цэвэр функцууд
pnpm --filter @nuul/news test:db     # tenant тусгаарлалт, хаалганууд
pnpm --filter @nuul/news lint
pnpm --filter @nuul/news exec tsc --noEmit
pnpm --filter @nuul/news build
pnpm --filter @nuul/news check:browser https://parlamentnews.mn
```

- [ ] Бүгд ногоон. `check:studio` нь зөвхөн DEV сервер дээр ажиллана
      (production-д cookie нь `__Secure-`, https шаарддаг).
