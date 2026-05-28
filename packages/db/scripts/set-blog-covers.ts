/**
 * Set Unsplash cover images on the 6 published blog posts.
 *
 * Idempotent — running again overwrites coverImage to the same URL.
 *
 * Run from repo root:
 *   pnpm --filter @nuul/db exec tsx scripts/set-blog-covers.ts
 */

import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=1200&h=750&fit=crop&q=80&auto=format`;
}

const COVERS: Record<string, string> = {
  // Website importance — laptop with code on desk
  "website-importance-mongolia": unsplash("1460925895917-afdab827c52f"),
  // Facebook ads guide — phone with social engagement
  "facebook-ads-beginner-guide": unsplash("1611162617213-7d7a39e9b1d7"),
  // AI chatbot — abstract AI/neural network visual
  "ai-chatbot-business-revenue": unsplash("1677442136019-21780ecad995"),
  // ROI measurement — analytics dashboard
  "digital-marketing-roi-measurement": unsplash("1551288049-bebda4e38f71"),
  // Small business online — cafe owner with laptop
  "small-business-online-7-steps": unsplash("1556761175-5973dc0f32e7"),
  // Brand identity — designer flat lay
  "brand-identity-basics": unsplash("1611532736597-de2d4265fba3"),
};

async function main() {
  let updated = 0;
  for (const [slug, url] of Object.entries(COVERS)) {
    const result = await prisma.blogPost.updateMany({
      where: { slug },
      data: { coverImage: url },
    });
    if (result.count > 0) {
      updated++;
      console.log(`  ✓ ${slug}`);
    } else {
      console.log(`  ✗ ${slug}  (no matching post)`);
    }
  }
  console.log(`\n${updated} cover image(s) set.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
