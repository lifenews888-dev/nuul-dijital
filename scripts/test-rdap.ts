/**
 * Manual RDAP smoke test — no test runner in project.
 *
 * Usage:
 *   npx tsx scripts/test-rdap.ts
 *   npx tsx scripts/test-rdap.ts kingwash
 *   npx tsx scripts/test-rdap.ts kingwash .mn,.com
 */
import { lookupRdap, searchDomains } from "../src/lib/domains/rdap";

async function main() {
  const label = process.argv[2] ?? "nuul";
  const tldsArg = process.argv[3];
  const tlds = tldsArg ? tldsArg.split(",").map((t) => (t.startsWith(".") ? t : `.${t}`)) : undefined;

  console.log("\n── Single RDAP probe (nuul.digital) ──");
  const probe = await lookupRdap("nuul.digital");
  console.log(probe);

  console.log(`\n── searchDomains("${label}") ──`);
  const search = await searchDomains(label, { tlds, skipReservations: true });
  if (!search) {
    console.error("Invalid label");
    process.exit(1);
  }

  console.log(JSON.stringify(search, null, 2));
  console.log("\n✅ Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});