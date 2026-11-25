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

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nuul/ui", "@nuul/db-news"],
};

module.exports = nextConfig;
