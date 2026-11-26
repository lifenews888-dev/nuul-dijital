const { resolve } = require("node:path");

/**
 * Монорепогийн эхэнд байгаа .env-ийг уншина.
 *
 * Next нь .env-ийг ЗӨВХӨН аппын хавтаснаас хайдаг тул `next dev` нь
 * `../../.env`-ийг хэзээ ч уншихгүй — vitest (vitest.setup.ts) болон
 * Prisma-ийн скриптүүд (dotenv -e ../../.env) түүнийг зориуд уншдаг учраас
 * тест ногоон байхад апп өөрөө санд холбогдож чаддаггүй байв.
 *
 * override: false — Vercel дээр env нь dashboard-аас ирдэг тул тэнд энэ нь
 * юу ч дарж бичихгүй, .env файл байхгүй бол dotenv чимээгүй өнгөрнө.
 */
require("dotenv").config({ path: resolve(__dirname, "../../.env"), override: false });

const { REMOTE_PATTERNS } = require("./lib/image-hosts.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nuul/ui", "@nuul/db-news"],

  /**
   * Хэмжсэн өрсөлдөгчид WebP үйлчилдэггүй (ikon.mn 296 KB, gogo.mn 335 KB,
   * news.mn 466 KB — бүгд JPEG, `Vary: Accept` ч байхгүй). Next нь content
   * negotiation ба responsive srcset-ийг эндээс автоматаар хийнэ.
   *
   * remotePatterns нь lib/image-hosts.js-ээс — lib/images.ts-ийн
   * safeImageSrc мөн тэндээс уншина, хоёр жагсаалт зөрөх боломжгүй.
   */
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: REMOTE_PATTERNS,
    minimumCacheTTL: 2592000, // 30 хоног
  },
};

module.exports = nextConfig;
