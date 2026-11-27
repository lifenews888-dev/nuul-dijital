/**
 * Parliament News — РЕДАКЦЫН ХЭРЭГЛЭГЧ үүсгэх, эрх өгөх.
 *
 * Ажиллуулах:
 *   MEMBER_EMAIL=bold@parlamentnews.mn pnpm db:seed:member
 *   MEMBER_EMAIL=... MEMBER_ROLE=REPORTER MEMBER_NAME="Б. Болд" pnpm db:seed:member
 *
 * Нууц үг нь КОДОД, САНД, ЛОГ-д ЦЭВЭР хэлбэрээр бичигдэхгүй. Шинэ хэрэглэгч
 * үүсэхэд санамсаргүй нууц үг үүсгэж, bcrypt hash-аар хадгалж, цэвэр
 * хэлбэрийг нь ЗӨВХӨН ТЕРМИНАЛД нэг удаа хэвлэнэ. Дахин харуулах арга
 * байхгүй — алдвал шинээр тавина.
 *
 * Хэрэглэгч аль хэдийн байвал нууц үгийг ДАРЖ БИЧИХГҮЙ. Үүрэг солих нь
 * нууц үг солихтой адил зүйл биш: эс бөгөөс сэтгүүлчийг хянагч болгох
 * болгонд хүн системээс чимээгүй гарчихна.
 */
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "../src/index";
import type { NewsRole } from "../src/index";

const TENANT_SLUG = (process.env.NEWS_TENANT_SLUG || "parlament").toLowerCase();

const ROLES: NewsRole[] = [
  "SUPER",
  "CHIEF",
  "REVIEWER",
  "REPORTER",
  "MEDIA",
  "LEGAL",
  "SOCIAL",
  "LIVE",
  "CONTRIBUTOR",
  "ANALYST",
];

/** bcrypt-ийн 72 байтын хязгаарт багтах, уншихад амар урт */
const PASSWORD_BYTES = 12;
const BCRYPT_ROUNDS = 12;

function readEnv() {
  const email = (process.env.MEMBER_EMAIL || "").toLowerCase().trim();
  if (!email) {
    throw new Error(
      "MEMBER_EMAIL хэрэгтэй. Жишээ: MEMBER_EMAIL=bold@parlamentnews.mn pnpm db:seed:member",
    );
  }
  if (!email.includes("@")) {
    throw new Error(`MEMBER_EMAIL нь имэйл биш: ${email}`);
  }

  const raw = (process.env.MEMBER_ROLE || "SUPER").toUpperCase().trim();
  if (!ROLES.includes(raw as NewsRole)) {
    throw new Error(`MEMBER_ROLE нь эдгээрийн нэг байх ёстой: ${ROLES.join(", ")} — өгсөн: ${raw}`);
  }

  return {
    email,
    role: raw as NewsRole,
    name: (process.env.MEMBER_NAME || "").trim() || null,
    /** Өгөгдсөн бол түүнийг хэрэглэнэ, ЮУ Ч хэвлэхгүй */
    givenPassword: process.env.MEMBER_PASSWORD || null,
  };
}

async function main() {
  const { email, role, name, givenPassword } = readEnv();

  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    throw new Error(`Tenant "${TENANT_SLUG}" олдсонгүй. Эхлээд pnpm db:seed ажиллуулна уу.`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  let generated: string | null = null;

  if (!existing) {
    /**
     * Үүсгэсэн нууц үгийг зөвхөн ЖИНХЭНЭ терминалд хэвлэнэ. stdout нь
     * хоолой, файл, лог бол хэвлэхгүй — эс бөгөөс «хаана ч хадгалагдаагүй»
     * гэдэг нь үнэн биш болно: `pnpm db:seed:member > log.txt`, CI-ийн
     * гаралт, агентын транскрипт бүгд түүнийг барьж авна. Ийм үед
     * MEMBER_PASSWORD-ээр өөрөө тавина.
     */
    if (!givenPassword && !process.stdout.isTTY) {
      throw new Error(
        "Гаралт нь терминал биш — үүсгэсэн нууц үг файл, лог руу бичигдэх эрсдэлтэй.\n" +
          "  Терминалаас шууд ажиллуулна уу, эсвэл MEMBER_PASSWORD=... өгнө уу.",
      );
    }

    const plain = givenPassword ?? randomBytes(PASSWORD_BYTES).toString("base64url");
    if (!givenPassword) generated = plain;

    await prisma.user.create({
      data: { email, name, password: await hash(plain, BCRYPT_ROUNDS) },
    });
  } else if (name && existing.name !== name) {
    await prisma.user.update({ where: { email }, data: { name } });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: { role, active: true },
    create: { tenantId: tenant.id, userId: user.id, role, active: true },
  });

  const label = ROLE_NAMES[role];
  console.log("");
  console.log(`  Сайт:       ${tenant.slug}`);
  console.log(`  Имэйл:      ${email}`);
  console.log(`  Нэр:        ${user.name || "—"}`);
  console.log(`  Үүрэг:      ${label} (${role})`);

  if (generated) {
    console.log("");
    console.log(`  НУУЦ ҮГ:    ${generated}`);
    console.log("");
    console.log("  Энэ нь ЗӨВХӨН ОДОО харагдана — хаана ч хадгалагдаагүй.");
    console.log("  Хуулж авч, нэвтэрсний дараа өөрөө солиорой.");
  } else if (existing) {
    console.log("");
    console.log("  Нууц үг:    хэвээр (хэрэглэгч аль хэдийн байсан)");
  }

  console.log("");
  console.log("  Нэвтрэх:    /studio/signin");
  console.log("");
}

const ROLE_NAMES: Record<NewsRole, string> = {
  SUPER: "Супер админ",
  CHIEF: "Ерөнхий редактор",
  REVIEWER: "Хянагч",
  REPORTER: "Сэтгүүлч",
  MEDIA: "Зураг, видео редактор",
  LEGAL: "Хуулийн мэдээний хариуцагч",
  SOCIAL: "Сошиал менежер",
  LIVE: "Шууд дамжуулалтын оператор",
  CONTRIBUTOR: "Зочин зохиогч",
  ANALYST: "Шинжээч",
};

main()
  .catch((e: unknown) => {
    console.error(`\n  ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
