import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { team as staticTeam } from "@/data/company";
import { testimonials as staticTestimonials } from "@/data/testimonials";

/**
 * Public content access layer.
 *
 * Each getter returns admin-managed DB content when available, and falls back
 * to the bundled static data when there is no database or no rows yet. Results
 * are cached and tag-revalidated, so admin edits reflect on the public site
 * (admin actions call revalidateTag(CONTENT_TAG)) while pages stay fast.
 */
export const CONTENT_TAG = "site-content";

export type PublicTeamMember = { name: string; role: string; avatar: string };
export type PublicTestimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  avatar: string;
};

export const getTeam = unstable_cache(
  async (): Promise<PublicTeamMember[]> => {
    if (!process.env.DATABASE_URL) return staticTeam;
    try {
      const rows = await db.teamMember.findMany({ where: { active: true }, orderBy: { order: "asc" } });
      if (!rows.length) return staticTeam;
      return rows.map((r) => ({ name: r.name, role: r.role, avatar: r.avatar }));
    } catch {
      return staticTeam;
    }
  },
  ["public-team"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

export const getTestimonials = unstable_cache(
  async (): Promise<PublicTestimonial[]> => {
    if (!process.env.DATABASE_URL) return staticTestimonials;
    try {
      const rows = await db.testimonial.findMany({ where: { published: true }, orderBy: { order: "asc" } });
      if (!rows.length) return staticTestimonials;
      return rows.map((r) => ({
        quote: r.quote,
        author: r.author,
        role: r.role,
        company: r.company,
        rating: r.rating,
        avatar: r.avatar,
      }));
    } catch {
      return staticTestimonials;
    }
  },
  ["public-testimonials"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);
