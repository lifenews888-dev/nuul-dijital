import { PrismaClient } from "@prisma/client";
import { projects } from "../src/data/projects";
import { caseStudies } from "../src/data/case-studies";
import { posts } from "../src/data/posts";
import { jobs } from "../src/data/jobs";
import { testimonials } from "../src/data/testimonials";

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

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
