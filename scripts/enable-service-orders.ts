/**
 * Enable hosting/email live checkout on production or staging.
 * Usage: npx tsx scripts/enable-service-orders.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.siteSetting.upsert({
    where: { key: "domains_service_orders_enabled" },
    update: { value: "true" },
    create: { key: "domains_service_orders_enabled", value: "true" },
  });
  console.log("✅ domains_service_orders_enabled = true");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());