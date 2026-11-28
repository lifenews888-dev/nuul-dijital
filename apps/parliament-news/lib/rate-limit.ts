import { prisma } from "@nuul/db-news";

/**
 * Хурдны хязгаар — тогтмол цонхоор, САНД.
 *
 * Санах ойд барьж болохгүй: Vercel дээр апп олон жижиг процесс болж
 * ажилладаг ба процесс бүр өөрийн тоолууртай болно. Халдагч хангалттай
 * хүсэлт илгээвэл процессууд хооронд тараагдаж, хязгаар бодитоор
 * ажиллахгүй. Postgres нь нийтлэг тоолуур.
 *
 * Гүйдэг цонх (sliding window) БИШ, тогтмол цонх: хамаагүй хялбар бөгөөд
 * хамгаалалтын хувьд хангалттай. Хамгийн муу тохиолдолд цонхны заагийн
 * дээр хязгаарын хоёр дахин хүсэлт багтана — 10 биш 20 — бөгөөд нууц үг
 * тааварлахад тэр нь ялгаа гаргахгүй.
 */

export type Window = { count: number; resetAt: Date };

export const LIMITS = {
  /**
   * Имэйл тутамд цагт 10 БУРУУ оролдлого. Хүн мартсан нууц үгээ 3-4 удаа
   * оролддог; 10 нь жинхэнэ хүнд саад болохгүй.
   */
  signinEmail: { limit: 10, windowMs: 3_600_000 },
  /**
   * IP тутамд цагт 30. Имэйлээс өндөр нь зориуд: нэг редакцын оффисын
   * сүлжээнээс хэд хэдэн сэтгүүлч орно, тэд бие биеэ хаах ёсгүй. Харин
   * нэг IP-гээс мянган имэйл туршихыг зогсооно.
   */
  signinIp: { limit: 30, windowMs: 3_600_000 },
} as const;

/** Одоогийн бичлэгээс дараагийн төлөв. Цонх дууссан бол шинээр эхэлнэ. */
export function nextWindow(current: Window | null, windowMs: number, now: Date): Window {
  if (!current || current.resetAt <= now) {
    return { count: 1, resetAt: new Date(now.getTime() + windowMs) };
  }
  return { count: current.count + 1, resetAt: current.resetAt };
}

/**
 * БҮРТГЭГДСЭН алдааны тоо дараагийн оролдлогыг зөвшөөрөх үү.
 *
 * `count < limit` бөгөөд `<=` БИШ: `count` нь аль хэдийн болсон алдааны
 * тоо тул 10 алдааны дараа 11 дэх оролдлого хаагдана. `<=` байсан үед
 * 11 алдаа болж, 12 дахь нь хаагддаг байв — нэгийн зөрүү.
 */
export function decide(
  count: number,
  limit: number,
  resetAt: Date,
  now: Date,
): { ok: boolean; retryAfter: number } {
  if (count < limit) return { ok: true, retryAfter: 0 };
  return {
    ok: false,
    retryAfter: Math.max(0, Math.ceil((resetAt.getTime() - now.getTime()) / 1000)),
  };
}

/**
 * Сан хүрэхгүй бол ЗӨВШӨӨРНӨ: хязгаарлагч унасан үед нэвтрэлтийг бүхэлд
 * нь хаах нь өөрөө үйлчилгээг зогсоох алдаа. Гэхдээ ЧИМЭЭГҮЙ БИШ.
 */
async function guarded<T>(what: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    /*
     * Бодитоор тохиолдсон: Prisma client хуучирсан тул `rateLimit` модель
     * байхгүй байсан ба хязгаарлагч «ажиллаж байгаа мэт» харагдаад огт
     * тоолохгүй байв. Хүснэгт хоосон, шалгуур улаан, шалтгаан далд.
     */
    console.error(`rate-limit (${what}): хязгаарлагч ажиллахгүй байна —`, e);
    return fallback;
  }
}

/**
 * Хаагдсан эсэхийг ШАЛГАНА — тоолуурыг НЭМЭХГҮЙ.
 *
 * Тоолох нь зөвхөн бүтэлгүй оролдлогод (`fail`). Амжилттай нэвтрэлт
 * тоологдвол редакцын багийнхан өдрийн ажлаараа бие биеэ хаана.
 */
export async function check(
  key: string,
  { limit }: { limit: number },
  now: Date = new Date(),
): Promise<{ ok: boolean; retryAfter: number }> {
  return guarded(
    "check",
    async () => {
      const row = await prisma.rateLimit.findUnique({ where: { key } });
      if (!row || row.resetAt <= now) return { ok: true, retryAfter: 0 };
      return decide(row.count, limit, row.resetAt, now);
    },
    { ok: true, retryAfter: 0 },
  );
}

/** Бүтэлгүй оролдлого бүртгэнэ. */
export async function fail(
  key: string,
  { windowMs }: { windowMs: number },
  now: Date = new Date(),
): Promise<void> {
  await guarded(
    "fail",
    async () => {
      const current = await prisma.rateLimit.findUnique({ where: { key } });
      const next = nextWindow(current, windowMs, now);
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: next.count, resetAt: next.resetAt },
        update: { count: next.count, resetAt: next.resetAt },
      });
      return undefined;
    },
    undefined,
  );
}

/** Амжилттай нэвтрэлт — тоолуурыг цэвэрлэнэ. */
export async function clear(keys: string[]): Promise<void> {
  await guarded(
    "clear",
    async () => {
      await prisma.rateLimit.deleteMany({ where: { key: { in: keys } } });
      return undefined;
    },
    undefined,
  );
}
