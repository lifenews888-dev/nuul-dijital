import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getIcon } from "@/lib/icon-registry";
import { services as staticServices, type Service } from "@/data/services";
import {
  softwareVendors as staticVendors,
  softwareCategories as staticCategories,
  type SoftwareVendor,
  type SoftwareCategory,
} from "@/data/software";
import {
  team as staticTeam,
  stats as staticStats,
  values as staticValues,
  processSteps as staticProcessSteps,
  type Stat,
  type Value,
  type ProcessStep,
} from "@/data/company";
import { testimonials as staticTestimonials } from "@/data/testimonials";
import { posts as staticPosts, type Post } from "@/data/posts";
import { projects as staticProjects, type Project } from "@/data/projects";
import { caseStudies as staticCaseStudies, type CaseStudy } from "@/data/case-studies";
import { jobs as staticJobs, type Job } from "@/data/jobs";
import { faqs as staticFaqs, type Faq } from "@/data/faqs";

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

export type PublicTeamMember = {
  name: string;
  role: string;
  avatar: string;
  /** { network: url } for the networks the admin filled in. */
  socials?: Record<string, string>;
};
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
      return rows.map((r) => ({
        name: r.name,
        role: r.role,
        avatar: r.avatar,
        socials:
          r.socials && typeof r.socials === "object" && !Array.isArray(r.socials)
            ? (r.socials as Record<string, string>)
            : undefined,
      }));
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
        videoUrl: r.videoUrl ?? undefined,
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
        gallery: r.gallery,
        videoUrl: r.videoUrl ?? undefined,
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

export const getFaqs = unstable_cache(
  async (): Promise<Faq[]> => {
    if (!process.env.DATABASE_URL) return staticFaqs;
    try {
      const rows = await db.faq.findMany({
        where: { published: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      if (!rows.length) return staticFaqs;
      return rows.map((r) => ({
        question: r.question,
        answer: r.answer,
        category: r.category,
      }));
    } catch {
      return staticFaqs;
    }
  },
  ["public-faqs"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

export const getStats = unstable_cache(
  async (): Promise<Stat[]> => {
    if (!process.env.DATABASE_URL) return staticStats;
    try {
      const rows = await db.stat.findMany({ where: { active: true }, orderBy: { order: "asc" } });
      if (!rows.length) return staticStats;
      return rows.map((r) => ({ value: r.value, suffix: r.suffix, label: r.label }));
    } catch {
      return staticStats;
    }
  },
  ["public-stats"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

export const getValues = unstable_cache(
  async (): Promise<Value[]> => {
    if (!process.env.DATABASE_URL) return staticValues;
    try {
      const rows = await db.value.findMany({ where: { active: true }, orderBy: { order: "asc" } });
      if (!rows.length) return staticValues;
      return rows.map((r) => ({ title: r.title, description: r.description }));
    } catch {
      return staticValues;
    }
  },
  ["public-values"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

export const getProcessSteps = unstable_cache(
  async (): Promise<ProcessStep[]> => {
    if (!process.env.DATABASE_URL) return staticProcessSteps;
    try {
      const rows = await db.processStep.findMany({ where: { active: true }, orderBy: { order: "asc" } });
      if (!rows.length) return staticProcessSteps;
      return rows.map((r) => ({ icon: r.icon, step: r.step, title: r.title, description: r.description }));
    } catch {
      return staticProcessSteps;
    }
  },
  ["public-process"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

/**
 * Catalogue getters.
 *
 * Same contract as everything above: database rows win, and an empty table
 * falls back to the bundled static catalogue. That is what lets the admin-
 * managed catalogue ship without changing a single public page until the first
 * row exists. `icon` is stored as a registry key and resolved back here, so the
 * shape handed to components is identical either way.
 */
export const getServices = unstable_cache(
  async (): Promise<Service[]> => {
    if (!process.env.DATABASE_URL) return staticServices;
    try {
      const rows = await db.service.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
      });
      if (!rows.length) return staticServices;
      return rows.map((r) => ({
        slug: r.slug,
        icon: getIcon(r.icon),
        title: r.title,
        short: r.short,
        description: r.description,
        features: r.features,
        deliverables: r.deliverables,
        featured: r.featured,
        accent: (r.accent as Service["accent"]) ?? undefined,
        image: r.image ?? undefined,
        gallery: r.gallery,
        videoUrl: r.videoUrl ?? undefined,
        priceMnt: r.priceMnt ?? undefined,
        priceNote: r.priceNote ?? undefined,
      }));
    } catch {
      return staticServices;
    }
  },
  ["public-services"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

export const getSoftwareCatalogue = unstable_cache(
  async (): Promise<{ vendors: SoftwareVendor[]; categories: SoftwareCategory[] }> => {
    const fallback = { vendors: staticVendors, categories: staticCategories };
    if (!process.env.DATABASE_URL) return fallback;
    try {
      const [vendorRows, categoryRows] = await Promise.all([
        db.softwareVendor.findMany({
          where: { active: true },
          orderBy: { priority: "asc" },
          include: { categories: { select: { slug: true } } },
        }),
        db.softwareCategory.findMany({
          where: { active: true },
          orderBy: { order: "asc" },
          include: { vendors: { select: { slug: true } } },
        }),
      ]);
      // Both halves have to be present: a vendor list with no categories would
      // render a catalogue with every coverage count at zero.
      if (!vendorRows.length || !categoryRows.length) return fallback;

      return {
        vendors: vendorRows.map((r) => ({
          slug: r.slug,
          name: r.name,
          icon: getIcon(r.icon),
          tagline: r.tagline,
          description: r.description,
          products: r.products,
          editions: r.editions.length ? r.editions : undefined,
          audience: r.audience,
          focus: r.focus as SoftwareVendor["focus"],
          featured: r.featured,
          priority: r.priority,
          accent: (r.accent as SoftwareVendor["accent"]) ?? undefined,
          image: r.image ?? undefined,
          gallery: r.gallery,
          videoUrl: r.videoUrl ?? undefined,
          priceMnt: r.priceMnt ?? undefined,
          priceNote: r.priceNote ?? undefined,
        })),
        categories: categoryRows.map((r) => ({
          slug: r.slug,
          title: r.title,
          description: r.description,
          group: r.group as SoftwareCategory["group"],
          vendors: r.vendors.map((v) => v.slug),
        })),
      };
    } catch {
      return fallback;
    }
  },
  ["public-software-catalogue"],
  { tags: [CONTENT_TAG], revalidate: 300 }
);
