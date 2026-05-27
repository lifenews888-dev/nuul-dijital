/**
 * One-off migration: replace any occurrence of "nuul.mn" with "nuul.digital"
 * across the site_settings table values (rebrand fix).
 *
 * Run from repo root:
 *   pnpm --filter @nuul/db exec tsx scripts/fix-nuul-mn-settings.ts
 */

import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Load .env from repo root so DATABASE_URL is available
loadEnv({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.siteSetting.findMany();
  let updated = 0;
  for (const r of rows) {
    if (!r.value.includes("nuul.mn")) continue;
    const newValue = r.value.replace(/nuul\.mn/g, "nuul.digital");
    await prisma.siteSetting.update({
      where: { id: r.id },
      data: { value: newValue },
    });
    console.log(`  ✓ ${r.key}: "${r.value}" → "${newValue}"`);
    updated++;
  }
  console.log(`\n${updated} setting(s) updated.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
