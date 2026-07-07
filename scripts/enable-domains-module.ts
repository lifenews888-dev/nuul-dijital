/**
 * Enable the domains module flag for local/staging testing.
 * Usage: npx tsx scripts/enable-domains-module.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.siteSetting.upsert({
    where: { key: "domains_module_enabled" },
    update: { value: "true" },
    create: { key: "domains_module_enabled", value: "true" },
  });
  console.log("✅ domains_module_enabled = true");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());