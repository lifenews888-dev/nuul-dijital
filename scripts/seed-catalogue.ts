/**
 * Copies the bundled static catalogues into the database so they become
 * admin-editable.
 *
 * Idempotent: rows are matched by slug and updated in place, so re-running
 * after editing the static files brings the database back in line without
 * creating duplicates. Media and price fields are left untouched on rows that
 * already exist — those are the admin's to set, not the seed's to overwrite.
 *
 * Usage: npx tsx scripts/seed-catalogue.ts
 */
import { PrismaClient } from "@prisma/client";
import { services } from "../src/data/services";
import { softwareVendors, softwareCategories } from "../src/data/software";
import { iconKeyOf } from "../src/lib/icon-registry";

const db = new PrismaClient();

async function seedServices() {
  let created = 0;
  for (const [index, s] of services.entries()) {
    const base = {
      title: s.title,
      short: s.short,
      description: s.description,
      features: s.features,
      deliverables: s.deliverables,
      icon: iconKeyOf(s.icon),
      accent: s.accent ?? null,
      featured: s.featured ?? false,
      order: index,
    };
    const existing = await db.service.findUnique({ where: { slug: s.slug } });
    if (existing) {
      await db.service.update({ where: { slug: s.slug }, data: base });
    } else {
      await db.service.create({ data: { slug: s.slug, ...base } });
      created += 1;
    }
  }
  console.log(`services: ${services.length} synced (${created} new)`);
}

async function seedCategories() {
  let created = 0;
  for (const [index, c] of softwareCategories.entries()) {
    const base = {
      title: c.title,
      description: c.description,
      group: c.group,
      order: index,
    };
    const existing = await db.softwareCategory.findUnique({ where: { slug: c.slug } });
    if (existing) {
      await db.softwareCategory.update({ where: { slug: c.slug }, data: base });
    } else {
      await db.softwareCategory.create({ data: { slug: c.slug, ...base } });
      created += 1;
    }
  }
  console.log(`categories: ${softwareCategories.length} synced (${created} new)`);
}

async function seedVendors() {
  let created = 0;
  for (const v of softwareVendors) {
    // Reset the category links from the static data on every run so the join
    // table mirrors the source rather than accumulating stale rows.
    const categorySlugs = softwareCategories
      .filter((c) => c.vendors.includes(v.slug))
      .map((c) => ({ slug: c.slug }));

    const base = {
      name: v.name,
      tagline: v.tagline,
      description: v.description,
      products: v.products,
      editions: v.editions ?? [],
      audience: v.audience,
      focus: v.focus,
      icon: iconKeyOf(v.icon),
      accent: v.accent ?? null,
      featured: v.featured,
      priority: v.priority,
      categories: { set: categorySlugs },
    };

    const existing = await db.softwareVendor.findUnique({ where: { slug: v.slug } });
    if (existing) {
      await db.softwareVendor.update({ where: { slug: v.slug }, data: base });
    } else {
      await db.softwareVendor.create({
        data: { slug: v.slug, ...base, categories: { connect: categorySlugs } },
      });
      created += 1;
    }
  }
  console.log(`vendors: ${softwareVendors.length} synced (${created} new)`);
}

async function main() {
  await seedServices();
  await seedCategories();
  await seedVendors();

  const [s, v, c] = await Promise.all([
    db.service.count(),
    db.softwareVendor.count(),
    db.softwareCategory.count(),
  ]);
  console.log(`\nin database — services: ${s}, vendors: ${v}, categories: ${c}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
