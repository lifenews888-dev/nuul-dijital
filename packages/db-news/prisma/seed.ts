/**
 * Parliament News — Gerel News tenant-ийн анхны өгөгдөл.
 *
 * Ажиллуулах:  ADMIN_EMAIL=... pnpm db:seed
 * Сонголттой:  ADMIN_PASSWORD=...  (байхгүй бол санамсаргүй нэгийг зохиож,
 *              зөвхөн терминал дээр нэг удаа хэвлэнэ)
 *
 * deleteMany хийхгүй — зөвхөн upsert. Дахин ажиллуулахад давхардахгүй.
 */
import { PrismaClient, Prisma } from "../generated/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TENANT_SLUG = "parlament";

const CATEGORIES: Array<{ slug: string; name: string; inMenu: boolean }> = [
  { slug: "chuulgan", name: "Чуулган", inMenu: true },
  { slug: "khuuliin-medee", name: "Хуулийн мэдээ", inMenu: true },
  { slug: "baingiin-khoroo", name: "Байнгын хороо", inMenu: false },
  { slug: "tosov", name: "Төсөв", inMenu: false },
  { slug: "gadaad-khariltsaa", name: "Гадаад харилцаа", inMenu: false },
  { slug: "niigem", name: "Нийгэм", inMenu: false },
  { slug: "ediin-zasag", name: "Эдийн засаг", inMenu: false },
  { slug: "video", name: "Видео", inMenu: true },
];

/**
 * apps/parliament-news/lib/settings.ts-ийн zod схемүүдийн default.
 * packages/db нь аппаас import хийхгүй тул гараар бичсэн — тэндэх тестүүд
 * ижил утгыг тогтоож байгаа тул зөрөх нь харагдана.
 */
const SETTINGS: Array<{ key: string; value: Prisma.InputJsonValue | typeof Prisma.JsonNull }> = [
  { key: "header", value: { pos: "left", size: 30, tagline: "", menu: "inline" } },
  {
    key: "footer",
    value: {
      addr: "", phone: "", email: "", sales: "", about: "", policy: "",
      fb: "", yt: "", ig: "", x: "",
    },
  },
  { key: "weather", value: Prisma.JsonNull },
  { key: "feed", value: { rss: true, fxSource: "", fxApi: "" } },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

  if (!adminEmail) {
    throw new Error(
      "ADMIN_EMAIL тохируулаагүй. Жишээ: ADMIN_EMAIL=admin@example.mn pnpm db:seed",
    );
  }

  console.log("🌱 Parliament News tenant...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: {},
    create: {
      slug: TENANT_SLUG,
      name: "Parliament News",
      domains: ["parlamentnews.mn", "www.parlamentnews.mn", "parlament.localhost"],
      brandColor: "#1d3fe3",
      accentColor: "#f26a1b",
    },
  });
  console.log(`   tenant: ${tenant.slug} (${tenant.id})`);

  for (const [index, c] of CATEGORIES.entries()) {
    await prisma.newsCategory.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: c.slug } },
      update: { name: c.name, inMenu: c.inMenu, order: index },
      create: { tenantId: tenant.id, slug: c.slug, name: c.name, inMenu: c.inMenu, order: index },
    });
  }
  console.log(`   ангилал: ${CATEGORIES.length}`);

  await prisma.liveState.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      attendance: 0,
      sessionStatus: "Хуралдаж байна",
      tickerOn: true,
    },
  });
  console.log("   шууд дамжуулалтын төлөв: бэлэн");

  for (const s of SETTINGS) {
    await prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: s.key } },
      update: {},
      create: { tenantId: tenant.id, key: s.key, value: s.value },
    });
  }
  console.log(`   тохиргоо: ${SETTINGS.length}`);

  let user = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!user) {
    const given = process.env.ADMIN_PASSWORD;
    const password = given || randomBytes(12).toString("base64url").slice(0, 16);

    user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Супер админ",
        password: await bcrypt.hash(password, 10),
      },
    });

    if (!given) {
      console.log("\n   ⚠ Шинэ хэрэглэгч үүсгэв. Нууц үг (зөвхөн одоо харагдана):");
      console.log(`      ${adminEmail}  /  ${password}`);
      console.log("   Нэвтэрсний дараа нууц үгээ сольж, хаанаас ч хуулж бүү хадгал.\n");
    }
  } else {
    console.log(`   хэрэглэгч аль хэдийн байна: ${adminEmail} (нууц үг хөндөөгүй)`);
  }

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: { role: "SUPER", active: true },
    create: { tenantId: tenant.id, userId: user.id, role: "SUPER", active: true },
  });
  console.log("   супер админ: бэлэн");

  console.log("\n✅ Parliament News tenant бэлэн.");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed бүтэлгүйтэв:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
