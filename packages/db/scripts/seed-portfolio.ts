/**
 * One-off seed: insert the two initial live portfolio items
 * (Yria.mn + Nuul.digital). Skips if portfolio table is non-empty.
 *
 * Run from repo root:
 *   pnpm --filter @nuul/db exec tsx scripts/seed-portfolio.ts
 */

import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.portfolio.count();
  if (count > 0) {
    console.log(`Portfolio already has ${count} rows — skipping seed.`);
    return;
  }

  await prisma.portfolio.createMany({
    data: [
      {
        title: "Yria.mn",
        category: "AI Чатбот платформ",
        description:
          "Монгол хэлтэй чатбот барих платформ. Facebook, Web, Viber-д суурилуулах боломжтой.",
        link: "https://yria.mn",
        status: "LIVE",
        gradient: "from-[#7B6FFF]/30 via-[#7B6FFF]/10 to-transparent",
        order: 1,
      },
      {
        title: "Nuul.digital",
        category: "Агентлагийн платформ",
        description:
          "Маркетинг агентлагийн вэб платформ — таны үзэж буй сайт өөрөө.",
        link: "/",
        status: "LIVE",
        gradient: "from-[#00E5B8]/30 via-[#00E5B8]/10 to-transparent",
        order: 2,
      },
    ],
  });

  console.log("✓ 2 portfolio items seeded.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
