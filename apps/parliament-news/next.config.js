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

  /**
   * Аюулгүй байдлын толгойнууд ЭНД, `vercel.json`-д БИШ.
   *
   * `vercel.json`-ийн `headers` нь зөвхөн Vercel дээр үйлчилнэ: `next
   * start`-аар локал эсвэл өөр орчинд ажиллуулахад толгой огт гарахгүй
   * бөгөөд тэр нь шалгах боломжгүй гэсэн үг. Next-ийн `headers()` нь
   * хаана ч ажиллана, Vercel ч түүнийг хүндэлнэ.
   *
   * `X-Frame-Options: SAMEORIGIN` — манай хуудсыг гадны сайт iframe-д
   * хийж, дарлалыг хулгайлахаас (clickjacking) сэргийлнэ. Мэдээний сайтыг
   * хуурамч хүрээнд оруулах нь улс төрийн агуулгад бодит эрсдэл.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
