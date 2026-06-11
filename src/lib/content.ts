import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { team as staticTeam } from "@/data/company";
import { testimonials as staticTestimonials } from "@/data/testimonials";
import { posts as staticPosts, type Post } from "@/data/posts";
import { projects as staticProjects, type Project } from "@/data/projects";
import { caseStudies as staticCaseStudies, type CaseStudy } from "@/data/case-studies";
import { jobs as staticJobs, type Job } from "@/data/jobs";

type Results = { label: string; value: string }[];

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

export const getPosts = unstable_cache(
  async (): Promise<Post[]> => {
    if (!process.env.DATABASE_URL) return staticPosts;
    try {
      const rows = await db.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        include: { author: true },
      });
      if (!rows.length) return staticPosts;
      return rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        content: r.content,
        category: r.category,
        author: r.author?.name ?? "Nuul Digital",
        authorRole: "",
        date: (r.publishedAt ?? r.createdAt).toISOString(),
        cover: r.cover,
        tags: r.tags,
        featured: r.featured,
      }));
    } catch {
      return staticPosts;
    }
  },
  ["public-posts"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

export const getProjects = unstable_cache(
  async (): Promise<Project[]> => {
    if (!process.env.DATABASE_URL) return staticProjects;
    try {
      const rows = await db.project.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      });
      if (!rows.length) return staticProjects;
      return rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        industry: r.industry,
        description: r.description,
        technologies: r.technologies,
        results: (r.results as unknown as Results) ?? [],
        image: r.image,
        gallery: r.gallery,
        link: r.link ?? undefined,
        year: r.year,
        services: r.services,
        featured: r.featured,
      }));
    } catch {
      return staticProjects;
    }
  },
  ["public-projects"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

export const getCaseStudies = unstable_cache(
  async (): Promise<CaseStudy[]> => {
    if (!process.env.DATABASE_URL) return staticCaseStudies;
    try {
      const rows = await db.caseStudy.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      });
      if (!rows.length) return staticCaseStudies;
      return rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        client: r.client,
        industry: r.industry,
        excerpt: r.excerpt,
        cover: r.cover,
        duration: r.duration,
        services: r.services,
        challenge: r.challenge,
        approach: r.approach,
        solution: r.solution,
        results: (r.results as unknown as Results) ?? [],
        testimonial: r.testimonial
          ? (r.testimonial as unknown as { quote: string; author: string; role: string })
          : undefined,
        featured: r.featured,
      }));
    } catch {
      return staticCaseStudies;
    }
  },
  ["public-case-studies"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

export const getJobs = unstable_cache(
  async (): Promise<Job[]> => {
    if (!process.env.DATABASE_URL) return staticJobs;
    try {
      const rows = await db.job.findMany({
        where: { active: true, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      });
      if (!rows.length) return staticJobs;
      return rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        department: r.department,
        location: r.location,
        type: r.type,
        level: r.level,
        summary: r.summary,
        responsibilities: r.responsibilities,
        requirements: r.requirements,
      }));
    } catch {
      return staticJobs;
    }
  },
  ["public-jobs"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);
