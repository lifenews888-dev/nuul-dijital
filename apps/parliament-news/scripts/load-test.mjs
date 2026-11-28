/**
 * Энгийн ачааллын тест — хоцролтын хуваарилалт.
 *
 * Яагаад: чуулганы шууд дамжуулалтын үед оргил ачаалал ирнэ, мөн
 * Vercel-ийн хамгийн ойрын edge нь Хонг Конг тул Монголоос хоцролт
 * ӨНДӨР. Дундаж тоо нь үүнийг нууна — p95 нь жинхэнэ хэрэглэгчийн
 * хамгийн муу туршлагыг хэлнэ.
 *
 * Ажиллуулах:
 *   node scripts/load-test.mjs https://parlamentnews.mn
 *   node scripts/load-test.mjs https://parlamentnews.mn 50 300
 *                                                       │   └ нийт хүсэлт
 *                                                       └ зэрэг хүсэлт
 *
 * Анхаар: ҮЙЛДВЭРЛЭЛИЙН сайт руу чиглүүлж байгаа бол тоогоо хэмжээлж
 * бод — энэ нь жинхэнэ хэрэглэгчидтэй мөр зэрэгцэн дараалалд орно.
 */
const ORIGIN = (process.argv[2] || "http://localhost:3014").replace(/\/+$/, "");
const CONCURRENCY = Number(process.argv[3] || 10);
const TOTAL = Number(process.argv[4] || 100);

/** Хэмжих замууд. Хуудас тус бүр өөр зардалтай. */
const PATHS = ["/", "/live", "/c/video", "/rss.xml", "/sitemap.xml"];

const results = [];
let issued = 0;

function pct(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function one() {
  const path = PATHS[issued % PATHS.length];
  issued += 1;

  const t0 = performance.now();
  try {
    const res = await fetch(ORIGIN + path, { redirect: "manual" });
    /** Биетийг БҮТНЭЭР уншина — толгой ирэх нь хуудас бэлэн гэсэн үг биш. */
    await res.arrayBuffer();
    results.push({ path, ms: performance.now() - t0, status: res.status });
  } catch (e) {
    results.push({ path, ms: performance.now() - t0, status: 0, error: String(e) });
  }
}

async function worker() {
  while (issued < TOTAL) await one();
}

console.log(`${ORIGIN} — ${TOTAL} хүсэлт, ${CONCURRENCY} зэрэг\n`);
const started = performance.now();
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const wall = (performance.now() - started) / 1000;

const byPath = new Map();
for (const r of results) {
  if (!byPath.has(r.path)) byPath.set(r.path, []);
  byPath.get(r.path).push(r);
}

console.log("зам".padEnd(14) + "тоо".padStart(5) + "p50".padStart(9) + "p95".padStart(9) + "дээд".padStart(9) + "  алдаа");
for (const [path, rows] of byPath) {
  const ms = rows.map((r) => r.ms).sort((a, b) => a - b);
  const bad = rows.filter((r) => r.status === 0 || r.status >= 500).length;
  console.log(
    path.padEnd(14) +
      String(rows.length).padStart(5) +
      `${pct(ms, 50).toFixed(0)}мс`.padStart(9) +
      `${pct(ms, 95).toFixed(0)}мс`.padStart(9) +
      `${ms[ms.length - 1].toFixed(0)}мс`.padStart(9) +
      `  ${bad}`,
  );
}

const all = results.map((r) => r.ms).sort((a, b) => a - b);
const errors = results.filter((r) => r.status === 0 || r.status >= 500);

console.log(
  `\nнийт ${results.length} хүсэлт / ${wall.toFixed(1)} сек = ${(results.length / wall).toFixed(1)} хүсэлт/сек`,
);
console.log(`p50 ${pct(all, 50).toFixed(0)}мс · p95 ${pct(all, 95).toFixed(0)}мс · p99 ${pct(all, 99).toFixed(0)}мс`);

if (errors.length > 0) {
  console.error(`\n${errors.length} алдаа:`);
  for (const e of errors.slice(0, 5)) console.error(`  ${e.path} → ${e.status} ${e.error ?? ""}`);
  process.exit(1);
}

/*
 * Зорилт: DEPLOY-CHECKLIST.md-д бичсэнээр Монголоос p50 < 300мс.
 * Түүнээс дээш бол Cloudflare дээр HTML кэшийн дүрэм бичих шийдвэр.
 */
console.log("\nалдаагүй.");
