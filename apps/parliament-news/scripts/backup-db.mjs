/**
 * Өгөгдлийн сангийн нөөц хуулбар.
 *
 * Яагаад скрипт: `DEPLOY-CHECKLIST.md` нь «схемийн өөрчлөлт хийхээсээ
 * өмнө нөөцөл» гэж шаарддаг бөгөөд тэр мөчид гараар `pg_dump`-ийн
 * параметр санах нь алдаа гаргах хамгийн амархан газар. Мөн нөөц
 * ХООСОН биш эсэхийг нь шалгана: 0 байтын файл нь нөөц биш.
 *
 * Ажиллуулах:
 *   node scripts/backup-db.mjs              → ../../backups/-д
 *   node scripts/backup-db.mjs /зам/руу
 *
 * Локал Docker-т `parlamentnews-pg` контейнер байхыг хүлээнэ. Үйлдвэрлэлд
 * Supabase-ийн автомат нөөцийг ашиглана — энэ нь түүнийг ОРЛОХГҮЙ.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.argv[2] || join(here, "..", "..", "..", "backups"));
const CONTAINER = process.env.PN_PG_CONTAINER || "parlamentnews-pg";
const DB = process.env.PN_PG_DB || "parlamentnews";
const USER = process.env.PN_PG_USER || "parlament";

mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const file = join(outDir, `${DB}-${stamp}.sql`);

console.log(`нөөцлөж байна: ${CONTAINER}/${DB} → ${file}`);

const dump = spawnSync("docker", ["exec", CONTAINER, "pg_dump", "-U", USER, DB], {
  encoding: "buffer",
  maxBuffer: 512 * 1024 * 1024,
});

if (dump.status !== 0) {
  console.error("pg_dump амжилтгүй:");
  console.error(dump.stderr?.toString() || dump.error);
  process.exit(1);
}

writeFileSync(file, dump.stdout);
const size = statSync(file).size;

/*
 * Хоосон нөөц нь нөөцгүйтэй адил, гэхдээ ХУДАЛ аюулгүй мэдрэмж өгнө.
 * Тиймээс хэмжээг шалгаж, бага бол чангаар унана.
 */
if (size < 1024) {
  console.error(`нөөц хэт жижиг (${size} байт) — алдаа гарсан байж магадгүй`);
  process.exit(1);
}

console.log(`бэлэн: ${(size / 1024).toFixed(0)} КБ`);
console.log("\nсэргээх:");
console.log(`  docker exec -i ${CONTAINER} psql -U ${USER} -d ${DB} < "${file}"`);
