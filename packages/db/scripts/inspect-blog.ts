import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

const p = new PrismaClient();

(async () => {
  const cats = await p.blogCategory.findMany({ orderBy: { name: "asc" } });
  const posts = await p.blogPost.findMany({
    select: { id: true, slug: true, title: true, status: true, categoryId: true },
  });
  console.log(`Categories (${cats.length}):`);
  cats.forEach((c) => console.log(`  ${c.slug.padEnd(15)} | ${c.name} | ${c.id}`));
  console.log(`\nPosts (${posts.length}):`);
  posts.forEach((x) => console.log(`  ${x.slug.padEnd(28)} | ${x.status} | ${x.title}`));
  await p.$disconnect();
})();
