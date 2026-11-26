/**
 * Parliament News — НИЙТИЙН САЙТЫГ ХАРАХ демо контент.
 *
 * Ажиллуулах:  pnpm db:seed:demo   (эхлээд `pnpm db:seed` ажилласан байх ёстой)
 *
 * 14 мэдээ: 12 нийтлэгдсэн, 1 ноорог, 1 цаг товлосон. Сүүлийн хоёр нь ЗОРИУД —
 * нүүр, ангилал, хайлт, RSS, sitemap-д тэд харагдах ЁСГҮЙ. Нүдээр шалгахад
 * `demo-nooreg` эсвэл `demo-tsag-tovlosson` хаа нэгтээ гарч ирвэл нийтийн
 * уншилтын хаалга эвдэрсэн байна.
 *
 * Зураг оруулахгүй: хавтасны `motif`-ийн эргэлт бодит хуудсан дээр ингэж
 * шалгагдана. Зургийн шугам нь Task 6-д нэмэгдэнэ.
 *
 * Дахин ажиллуулахад давхардахгүй (`upsert` by tenantId_slug).
 */
import { prisma } from "../src/index";

const TENANT_SLUG = (process.env.NEWS_TENANT_SLUG || "parlament").toLowerCase();

const DAY = 86_400_000;
/** Стори хэдэн хоног амьдрах */
const STORY_DAYS = 3;
const MOTIFS = ["grid", "hemi", "cols", "bars", "rings", "sun", "wave"];

type Demo = {
  slug: string;
  title: string;
  kicker: string;
  lead: string;
  body: string;
  category: string;
  tags: string[];
  reporter: string;
  /** Хэдэн хоногийн өмнө нийтлэгдсэн. Сөрөг бол ирээдүйд — цаг товлосон. */
  daysAgo: number;
  status?: "DRAFT" | "PUBLISHED";
  featured?: boolean;
  story?: boolean;
  /**
   * `public/demo/`-ийн зураг. Зөвхөн хэдэн мэдээнд — үлдсэнд нь хавтасны
   * `motif` эргэлт бодит хуудсан дээр шалгагдана.
   */
  image?: { url: string; caption: string };
};

const POSTS: Demo[] = [
  {
    slug: "2027-ony-tosviin-toslijg-helelcej-ehellee",
    title: "2027 оны төсвийн төслийг чуулганаар хэлэлцэж эхэллээ",
    kicker: "ТӨСӨВ",
    lead: "Улсын Их Хурлын нэгдсэн хуралдаанаар 2027 оны улсын төсвийн төслийн анхны хэлэлцүүлгийг эхлүүлэв.",
    body: "Улсын Их Хурлын нэгдсэн хуралдаанаар 2027 оны улсын төсвийн төслийг хэлэлцэж эхэллээ. Сангийн сайд төслийг танилцуулж, орлогын төлөвлөгөө өмнөх оныхоос өссөн болохыг тайлбарлав.\n\nТөсвийн зарлагын бүтцэд боловсрол, эрүүл мэндийн салбарын хувь хэмжээг нэмэгдүүлэх санал орсон байна. Байнгын хороод салбар тус бүрээр саналаа хүргүүлэхээр болов.\n\nХэлэлцүүлэг ирэх долоо хоногт үргэлжилнэ.",
    category: "tosov",
    tags: ["төсөв", "чуулган"],
    reporter: "Б.Отгонбаяр",
    daysAgo: 1,
    featured: true,
    image: { url: "/demo/palace.jpg", caption: "Төрийн ордон" },
  },
  {
    slug: "bolovsrolyn-tuhai-huuliin-shinechilsen-nairuulga",
    title: "Боловсролын тухай хуулийн шинэчилсэн найруулгыг баталлаа",
    kicker: "ХУУЛЬ",
    lead: "Ерөнхий боловсролын сургуулийн хичээлийн жилийн бүтэц, багшийн ачааллыг шинэчлэн тогтоох заалтууд орлоо.",
    body: "Улсын Их Хурал Боловсролын тухай хуулийн шинэчилсэн найруулгыг баталлаа. Хуулиар ерөнхий боловсролын сургуулийн хичээлийн жилийн бүтэц шинэчлэгдэнэ.\n\nБагшийн ачааллын дээд хязгаарыг тогтоож, цалингийн сүлжээг шинэчлэх заалт мөн орсон. Хууль ирэх хичээлийн жилээс хэрэгжинэ.",
    category: "khuuliin-medee",
    tags: ["хууль", "чуулган"],
    reporter: "Д.Сарангэрэл",
    daysAgo: 2,
    featured: true,
    image: { url: "/demo/flag.jpg", caption: "Монгол Улсын төрийн далбаа" },
  },
  {
    slug: "baingiin-khoroo-eruul-mendiin-daatgal",
    title: "Байнгын хороо эрүүл мэндийн даатгалын асуудлыг хэлэлцэв",
    kicker: "БАЙНГЫН ХОРОО",
    lead: "Нийгмийн бодлогын байнгын хороо эрүүл мэндийн даатгалын сангийн зарцуулалтын тайланг сонслоо.",
    body: "Нийгмийн бодлогын байнгын хорооны хуралдаанаар эрүүл мэндийн даатгалын сангийн өнгөрсөн оны зарцуулалтын тайланг хэлэлцэв.\n\nГишүүд сангийн орлого, зарлагын тэнцвэр, эмийн үнийн хөнгөлөлтийн хамрах хүрээний талаар асуулт тавив.",
    category: "baingiin-khoroo",
    tags: ["чуулган"],
    reporter: "Н.Ганболд",
    daysAgo: 3,
  },
  {
    slug: "hiliin-boomtyn-heleltseer",
    title: "Хилийн боомтын хэлэлцээрийг соёрхон баталлаа",
    kicker: "ГАДААД",
    lead: "Монгол Улс, Бүгд Найрамдах Хятад Ард Улсын хооронд байгуулсан хилийн боомтын тухай хэлэлцээрийг соёрхон баталав.",
    body: "Улсын Их Хурал хилийн боомтын тухай засгийн газар хоорондын хэлэлцээрийг соёрхон баталлаа.\n\nХэлэлцээрээр боомтын нэвтрүүлэх хүчин чадлыг нэмэгдүүлэх, ачаа тээврийн журмыг нэгтгэх зохицуулалт тусгагдсан.",
    category: "gadaad-khariltsaa",
    tags: ["чуулган"],
    reporter: "С.Батзориг",
    daysAgo: 4,
    story: true,
    image: { url: "/demo/poster.jpg", caption: "Хэлэлцээрийн ёслол" },
  },
  {
    slug: "calin-tetgevriin-nemegdel",
    title: "Цалин, тэтгэврийн нэмэгдлийн тухай асуудлыг хэлэлцэнэ",
    kicker: "НИЙГЭМ",
    lead: "Төрийн албан хаагчийн цалин, тэтгэврийн хэмжээг нэмэгдүүлэх саналыг төсвийн хэлэлцүүлэгт оруулахаар болов.",
    body: "Төрийн албан хаагчийн цалин, тэтгэврийн хэмжээг нэмэгдүүлэх тухай саналыг 2027 оны төсвийн хэлэлцүүлэгт хамт оруулахаар шийдвэрлэв.\n\nСаналыг дэмжсэн болон эсэргүүцсэн гишүүд байр сууриа илэрхийлэв.",
    category: "niigem",
    tags: ["төсөв", "чуулган"],
    reporter: "Б.Отгонбаяр",
    daysAgo: 6,
  },
  {
    slug: "uul-uurhain-orlogyn-huvaarilalt",
    title: "Уул уурхайн салбарын орлогын хуваарилалтыг шинэчилнэ",
    kicker: "ЭДИЙН ЗАСАГ",
    lead: "Орон нутагт үлдэх орлогын хувь хэмжээг нэмэгдүүлэх хуулийн төслийг өргөн мэдүүллээ.",
    body: "Уул уурхайн салбарын орлогын хуваарилалтыг шинэчлэх хуулийн төслийг Засгийн газраас өргөн мэдүүлэв.\n\nТөслөөр ашигт малтмалын нөөц ашигласны төлбөрөөс орон нутагт үлдэх хувь хэмжээ нэмэгдэнэ.",
    category: "ediin-zasag",
    tags: ["хууль", "төсөв"],
    reporter: "Д.Сарангэрэл",
    daysAgo: 7,
    featured: true,
    image: { url: "/demo/palace.jpg", caption: "Чуулганы танхим" },
  },
  {
    slug: "negdsen-huraldaanaar-hoyor-tosol",
    title: "Нэгдсэн хуралдаанаар хоёр хуулийн төслийг хэлэлцэв",
    kicker: "ЧУУЛГАН",
    lead: "Өнөөдрийн нэгдсэн хуралдаанаар хоёр хуулийн төслийн анхны хэлэлцүүлгийг явууллаа.",
    body: "Улсын Их Хурлын нэгдсэн хуралдаанаар хоёр хуулийн төслийн анхны хэлэлцүүлгийг явуулав.\n\nХоёр төслийг хоёуланг нь үргэлжлүүлэн хэлэлцэхээр санал хураалтаар шийдвэрлэв.",
    category: "chuulgan",
    tags: ["чуулган", "хууль"],
    reporter: "Н.Ганболд",
    daysAgo: 9,
  },
  {
    slug: "oron-nutgiin-hurungu-oruulalt",
    title: "Орон нутгийн хөрөнгө оруулалтын төлөвлөгөөг хэлэлцлээ",
    kicker: "ТӨСӨВ",
    lead: "Аймаг, нийслэлийн хөрөнгө оруулалтын төлөвлөгөөний төслийг байнгын хороо хэлэлцэв.",
    body: "Орон нутгийн хөрөнгө оруулалтын төлөвлөгөөний төслийг Төсвийн байнгын хороо хэлэлцэв.\n\nЗам, сургууль, цэцэрлэгийн барилгын ажлын санхүүжилтийн асуудал хөндөгдөв.",
    category: "tosov",
    tags: ["төсөв"],
    reporter: "С.Батзориг",
    daysAgo: 11,
  },
  {
    slug: "hodolmoriin-tuhai-huuld-nemelt",
    title: "Хөдөлмөрийн тухай хуульд нэмэлт оруулах төсөл өргөн мэдүүллээ",
    kicker: "ХУУЛЬ",
    lead: "Алсын зайнаас ажиллах хэлбэрийг зохицуулах заалт нэмэх санал гаргажээ.",
    body: "Хөдөлмөрийн тухай хуульд нэмэлт оруулах тухай хуулийн төслийг гишүүд өргөн мэдүүлэв.\n\nТөслөөр алсын зайнаас ажиллах хөдөлмөрийн харилцааг зохицуулах заалт нэмэгдэнэ.",
    category: "khuuliin-medee",
    tags: ["хууль"],
    reporter: "Б.Отгонбаяр",
    daysAgo: 13,
    story: true,
  },
  {
    slug: "agaaryn-bohirdlyn-esreg-arga-hemjee",
    title: "Агаарын бохирдлын эсрэг арга хэмжээний төлөвлөгөөг батлав",
    kicker: "НИЙГЭМ",
    lead: "Нийслэлийн агаарын чанарыг сайжруулах гурван жилийн төлөвлөгөөг хэлэлцэн баталлаа.",
    body: "Агаарын бохирдлыг бууруулах гурван жилийн төлөвлөгөөг байнгын хороо хэлэлцэн дэмжив.\n\nТөлөвлөгөөнд айл өрхийн халаалтын шийдэл, нийтийн тээврийн шинэчлэл тусгагдсан.",
    category: "niigem",
    tags: ["чуулган"],
    reporter: "Д.Сарангэрэл",
    daysAgo: 15,
  },
  {
    slug: "gadaad-hudaldaanii-ergelt",
    title: "Гадаад худалдааны эргэлтийн үзүүлэлтийг танилцууллаа",
    kicker: "ЭДИЙН ЗАСАГ",
    lead: "Эхний арван сарын гадаад худалдааны эргэлт өмнөх оны мөн үеэс өссөн байна.",
    body: "Гадаад худалдааны эргэлтийн үзүүлэлтийг Эдийн засгийн байнгын хорооны хуралдаанаар танилцуулав.\n\nЭкспортын бүтцэд уул уурхайн бус бүтээгдэхүүний эзлэх хувь өссөн болохыг тэмдэглэв.",
    category: "ediin-zasag",
    tags: ["төсөв"],
    reporter: "Н.Ганболд",
    daysAgo: 17,
  },
  {
    slug: "gishuudiin-irtsiin-tailan",
    title: "Гишүүдийн ирцийн тайланг нийтэд мэдээллээ",
    kicker: "ЧУУЛГАН",
    lead: "Намрын чуулганы хугацаанд болсон нэгдсэн хуралдааны ирцийн мэдээллийг танилцуулав.",
    body: "Намрын ээлжит чуулганы нэгдсэн хуралдаануудын ирцийн тайланг Тамгын газраас мэдээлэв.\n\nИрцийн дундаж үзүүлэлт өмнөх чуулганыхаас өссөн байна.",
    category: "chuulgan",
    tags: ["чуулган"],
    reporter: "С.Батзориг",
    daysAgo: 19,
  },

  // --- Нийтэд ХАРАГДАХ ЁСГҮЙ хоёр мэдээ ---
  {
    slug: "demo-nooreg",
    title: "НООРОГ: энэ мэдээ нийтэд харагдах ёсгүй",
    kicker: "НООРОГ",
    lead: "Хэрэв та үүнийг нийтийн хуудсан дээр харж байвал нийтийн уншилтын хаалга эвдэрсэн байна.",
    body: "Энэ бол ноорог мэдээ. Нүүр, ангилал, таг, хайлт, RSS, sitemap-ийн аль нэгэнд гарч ирвэл алдаа.",
    category: "chuulgan",
    tags: ["чуулган"],
    reporter: "Туршилт",
    daysAgo: 0,
    status: "DRAFT",
  },
  {
    slug: "demo-tsag-tovlosson",
    title: "ЦАГ ТОВЛОСОН: энэ мэдээ гурван хоногийн дараа нийтлэгдэнэ",
    kicker: "ЦАГ ТОВЛОСОН",
    lead: "Төлөв нь PUBLISHED боловч publishedAt нь ирээдүйд байгаа тул одоо харагдах ёсгүй.",
    body: "Энэ мэдээний publishedAt нь ирээдүйд байна. Нийтийн хуудсанд одоо гарч ирвэл publishedAt-ийн шүүлт ажиллахгүй байна гэсэн үг.",
    category: "chuulgan",
    tags: ["чуулган"],
    reporter: "Туршилт",
    daysAgo: -3,
    status: "PUBLISHED",
  },
];


/** Artifact-ийн `ST` (site-v2/index.html:714) */
const BILL_STAGES = [
  "Өргөн мэдүүлсэн",
  "Байнгын хороо",
  "Анхны хэлэлцүүлэг",
  "Эцсийн хэлэлцүүлэг",
  "Баталсан",
];

/** Artifact-ийн «Өнөөдөр хэлэлцэх асуудал» самбарын гурван мөр */
const AGENDA = [
  { time: "10:00", text: "Нэгдсэн хуралдаан — төсвийн гүйцэтгэлийн тайлан" },
  { time: "14:00", text: "Эдийн засгийн байнгын хороо" },
  { time: "16:30", text: "Ажлын хэсэг — сонгуулийн хууль" },
];

/**
 * Гүйдэг мөрийн СУРТАЛЧИЛГАА. Artifact-ийн `buildTicker()` нь мэдээний
 * гарчгуудыг өөрөө жагсаадаг ба эдгээрийг гурав тутамд нэг оруулдаг —
 * тиймээс энэ нь мэдээ биш, зар.
 */
const TICKER_ADS = [
  { text: "Эрдэнэт үйлдвэр — 2026 оны нэгдсэн тайлан нээлттэй", url: "https://example.mn/erdenet" },
  { text: "Монголын хөрөнгийн бирж — өдрийн арилжааны мэдээлэл", url: "https://example.mn/mse" },
  { text: "Үндэсний статистикийн хороо — макро үзүүлэлт", url: null },
  { text: "УИХ-ын номын сан — хуулийн эмхэтгэл 2026", url: null },
];

/** Улаанбаатарын өнөөдөр, UTC шөнө дундаар (`@db.Date`-ийн хэлбэр) */
function ubToday(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(ymd + "T00:00:00.000Z");
}

/**
 * Нүүрний виджетүүдийн демо өгөгдөл: шууд байдал, өнөөдрийн хуваарь,
 * гүйдэг мөрийн зар, нэг хуулийн төслийн явц.
 *
 * Дахин ажиллуулахад давхардахгүй: хуваарь ба зарыг цэвэрлээд дахин
 * үүсгэнэ, хууль ба түүний шатууд нь `upsert`.
 */
async function seedModules(tenantId: string, budgetPostId: string | null) {
  await prisma.liveState.upsert({
    where: { tenantId },
    update: { attendance: 98, sessionStatus: "Хуралдаж байна", tickerOn: true },
    create: { tenantId, attendance: 98, sessionStatus: "Хуралдаж байна", tickerOn: true },
  });

  const today = ubToday();
  await prisma.agenda.deleteMany({ where: { tenantId, date: today } });
  await prisma.agenda.createMany({
    data: AGENDA.map((a, i) => ({ tenantId, date: today, time: a.time, text: a.text, order: i })),
  });

  await prisma.tickerAd.deleteMany({ where: { tenantId } });
  await prisma.tickerAd.createMany({
    data: TICKER_ADS.map((a, i) => ({ tenantId, text: a.text, url: a.url, active: true, order: i })),
  });

  if (!budgetPostId) return { agenda: AGENDA.length, ads: TICKER_ADS.length, stages: 0 };

  // Төсвийн мэдээ нь «хэлэлцэж эхэллээ» — 3 дахь шат (индекс 2)
  const CURRENT = 2;
  const bill = await prisma.bill.upsert({
    where: { tenantId_postId: { tenantId, postId: budgetPostId } },
    update: { title: "2027 оны улсын төсвийн тухай хууль", stage: CURRENT },
    create: {
      tenantId,
      postId: budgetPostId,
      title: "2027 оны улсын төсвийн тухай хууль",
      stage: CURRENT,
    },
  });

  for (const [index, name] of BILL_STAGES.entries()) {
    const reached = index <= CURRENT;
    await prisma.billStage.upsert({
      where: { billId_index: { billId: bill.id, index } },
      update: {},
      create: {
        tenantId,
        billId: bill.id,
        index,
        date: reached ? new Date(Date.now() - (CURRENT - index + 1) * DAY) : null,
        note: reached
          ? name + " — 2027 оны улсын төсвийн төслийн хэлэлцүүлгийн " + (index + 1) + " дэх шат."
          : null,
        sources: [],
      },
    });
  }

  return { agenda: AGENDA.length, ads: TICKER_ADS.length, stages: BILL_STAGES.length };
}

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    throw new Error(
      `"${TENANT_SLUG}" tenant алга. Эхлээд: ADMIN_EMAIL=... pnpm db:seed`,
    );
  }

  const categories = await prisma.newsCategory.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, slug: true },
  });
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
  if (bySlug.size === 0) {
    throw new Error("Ангилал алга. Эхлээд: pnpm db:seed");
  }

  console.log(`🌱 ${TENANT_SLUG} tenant-д демо контент...`);

  let published = 0;
  let hidden = 0;
  let withImage = 0;

  for (const [index, p] of POSTS.entries()) {
    const when = new Date(Date.now() - p.daysAgo * DAY);
    const status = p.status ?? "PUBLISHED";
    const publishedAt = status === "PUBLISHED" ? when : null;

    const data = {
      title: p.title,
      kicker: p.kicker,
      lead: p.lead,
      body: p.body,
      date: when,
      categoryId: bySlug.get(p.category) ?? null,
      reporter: p.reporter,
      tags: p.tags,
      motif: MOTIFS[index % MOTIFS.length],
      theme: index % 3,
      featured: p.featured ?? false,
      story: p.story ?? false,
      // Стори нь ХУГАЦААТАЙ: `storyUntil` байхгүй бол нүүрний зурваст гарахгүй
      storyUntil: p.story ? new Date(Date.now() + STORY_DAYS * DAY) : null,
      storyUntil: p.story ? new Date(Date.now() + 7 * DAY) : null,
      status,
      publishedAt,
    };

    const post = await prisma.newsPost.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.slug } },
      update: data,
      create: { ...data, tenantId: tenant.id, slug: p.slug },
    });

    // Медиад давтагдахгүй түлхүүр байхгүй тул цэвэрлээд дахин үүсгэнэ
    await prisma.newsMedia.deleteMany({ where: { postId: post.id } });
    if (p.image) {
      await prisma.newsMedia.create({
        data: {
          tenantId: tenant.id,
          postId: post.id,
          kind: "image",
          url: p.image.url,
          caption: p.image.caption,
          order: 0,
        },
      });
      withImage++;
    }

    if (status === "PUBLISHED" && p.daysAgo > 0) published++;
    else hidden++;
  }

  const budget = await prisma.newsPost.findFirst({
    where: { tenantId: tenant.id, slug: "2027-ony-tosviin-toslijg-helelcej-ehellee" },
    select: { id: true },
  });
  const mods = await seedModules(tenant.id, budget?.id ?? null);

  console.log(`   нийтлэгдсэн, харагдах ёстой: ${published}`);
  console.log(`   зурагтай: ${withImage}`);
  console.log(`   ЗОРИУД нуугдсан (ноорог + цаг товлосон): ${hidden}`);
  const stories = POSTS.filter((p) => p.story).length;
  console.log(`   стори (${STORY_DAYS} хоног амьдрах): ${stories}`);
  console.log(
    `   виджет: live 1 · хуваарь ${mods.agenda} · ticker зар ${mods.ads} · хуулийн шат ${mods.stages}`,
  );
  console.log(`\n✅ ${POSTS.length} демо мэдээ бэлэн.`);
  console.log(
    `   Шалгах: demo-nooreg ба demo-tsag-tovlosson нь нийтийн хуудсанд ГАРАХ ЁСГҮЙ.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
