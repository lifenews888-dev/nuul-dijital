import { PrismaClient } from "@prisma/client";
import { projects } from "../src/data/projects";
import { caseStudies } from "../src/data/case-studies";
import { posts } from "../src/data/posts";
import { jobs } from "../src/data/jobs";
import { testimonials } from "../src/data/testimonials";
import { faqs } from "../src/data/faqs";
import { team, stats, values, processSteps } from "../src/data/company";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Nuul Digital database...");

  // Services are managed as static data (src/data/services.ts), not in the CMS.

  for (const p of projects) {
    await db.project.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        industry: p.industry,
        description: p.description,
        technologies: p.technologies,
        results: p.results,
        image: p.image,
        gallery: p.gallery,
        link: p.link,
        year: p.year,
        services: p.services,
        featured: p.featured ?? false,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  for (const c of caseStudies) {
    await db.caseStudy.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        title: c.title,
        client: c.client,
        industry: c.industry,
        excerpt: c.excerpt,
        cover: c.cover,
        duration: c.duration,
        services: c.services,
        challenge: c.challenge,
        approach: c.approach,
        solution: c.solution,
        results: c.results,
        testimonial: c.testimonial ?? undefined,
        featured: c.featured ?? false,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  for (const p of posts) {
    await db.post.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        category: p.category,
        cover: p.cover,
        tags: p.tags,
        featured: p.featured ?? false,
        status: "PUBLISHED",
        publishedAt: new Date(p.date),
      },
    });
  }

  for (const j of jobs) {
    await db.job.upsert({
      where: { slug: j.slug },
      update: {},
      create: {
        slug: j.slug,
        title: j.title,
        department: j.department,
        location: j.location,
        type: j.type,
        level: j.level,
        summary: j.summary,
        responsibilities: j.responsibilities,
        requirements: j.requirements,
      },
    });
  }

  // Testimonials & FAQs have no natural unique key, so guard on emptiness to
  // keep the whole seed idempotent (safe to re-run, e.g. against production).
  if ((await db.testimonial.count()) === 0) {
    for (const [i, t] of testimonials.entries()) {
      await db.testimonial.create({
        data: {
          quote: t.quote,
          author: t.author,
          role: t.role,
          company: t.company,
          rating: t.rating,
          avatar: t.avatar,
          order: i,
        },
      });
    }
  }

  if ((await db.faq.count()) === 0) {
    for (const [i, f] of faqs.entries()) {
      await db.faq.create({
        data: {
          question: f.question,
          answer: f.answer,
          category: f.category,
          order: i,
        },
      });
    }
  }

  // Team members — seed only when empty so the public /about team becomes
  // editable in the CMS (without it the page falls back to static data that
  // admins cannot change).
  if ((await db.teamMember.count()) === 0) {
    for (const [i, m] of team.entries()) {
      await db.teamMember.create({
        data: { name: m.name, role: m.role, avatar: m.avatar, order: i, active: true },
      });
    }
  }

  // Homepage stats / values / process — seed only when empty so the static
  // homepage sections become editable in the CMS.
  if ((await db.stat.count()) === 0) {
    for (const [i, s] of stats.entries()) {
      await db.stat.create({ data: { value: s.value, suffix: s.suffix, label: s.label, order: i } });
    }
  }
  if ((await db.value.count()) === 0) {
    for (const [i, v] of values.entries()) {
      await db.value.create({ data: { title: v.title, description: v.description, order: i } });
    }
  }
  if ((await db.processStep.count()) === 0) {
    for (const [i, p] of processSteps.entries()) {
      await db.processStep.create({
        data: { step: p.step, title: p.title, description: p.description, icon: p.icon, order: i },
      });
    }
  }

  // Domain TLD catalog — upsert so prices stay idempotent on re-run.
  const tldProducts = [
    { tld: ".mn", labelMn: "Монгол", labelEn: "Mongolia", registerPrice: 45000, renewPrice: 45000, sortOrder: 0, featured: true },
    { tld: ".com", labelMn: "Ком", labelEn: "Commercial", registerPrice: 62500, renewPrice: 62500, sortOrder: 1, featured: true },
    { tld: ".org", labelMn: "Байгууллага", labelEn: "Organization", registerPrice: 75000, renewPrice: 75000, sortOrder: 2, featured: false },
    { tld: ".net", labelMn: "Сүлжээ", labelEn: "Network", registerPrice: 94600, renewPrice: 94600, sortOrder: 3, featured: false },
    { tld: ".shop", labelMn: "Дэлгүүр", labelEn: "Shop", registerPrice: 88000, renewPrice: 88000, sortOrder: 4, featured: false },
  ];

  for (const t of tldProducts) {
    await db.tldProduct.upsert({
      where: { tld: t.tld },
      update: {
        labelMn: t.labelMn,
        labelEn: t.labelEn,
        registerPrice: t.registerPrice,
        renewPrice: t.renewPrice,
        sortOrder: t.sortOrder,
        featured: t.featured,
        status: "ACTIVE",
      },
      create: {
        tld: t.tld,
        labelMn: t.labelMn,
        labelEn: t.labelEn,
        registerPrice: t.registerPrice,
        renewPrice: t.renewPrice,
        sortOrder: t.sortOrder,
        featured: t.featured,
        status: "ACTIVE",
      },
    });
  }

  const siteSettings: { key: string; value: string }[] = [
    { key: "domains_module_enabled", value: "false" },
    { key: "domains_ai_suggest_enabled", value: "false" },
    { key: "domains_qpay_enabled", value: "true" },
    { key: "domains_auto_register_enabled", value: "false" },
    { key: "domains_service_orders_enabled", value: "false" },
    { key: "domains_registrar_provider", value: "manual" },
    { key: "bankName", value: "Хаан банк" },
    { key: "bankAccountName", value: "Nuul Digital LLC" },
    { key: "bankAccountNumber", value: "5000000000" },
    { key: "bankIban", value: "MN00 0000 0000 0000 0000" },
  ];

  for (const s of siteSettings) {
    await db.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
