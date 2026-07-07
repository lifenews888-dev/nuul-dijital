import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { services } from "@/data/services";
import { industries } from "@/data/industries";
import { getProjects, getCaseStudies, getPosts, getJobs } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const [projects, caseStudies, posts, jobs] = await Promise.all([
    getProjects(),
    getCaseStudies(),
    getPosts(),
    getJobs(),
  ]);

  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/industries",
    "/portfolio",
    "/case-studies",
    "/blog",
    "/careers",
    "/contact",
    "/quote",
    "/domains",
    "/orders/lookup",
    "/hosting",
    "/business-email",
    "/ssl",
    "/legal/privacy",
    "/legal/terms",
    "/legal/domain-registration",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const dynamicRoutes = [
    ...services.map((s) => `/services/${s.slug}`),
    ...industries.map((i) => `/industries/${i.slug}`),
    ...projects.map((p) => `/portfolio/${p.slug}`),
    ...caseStudies.map((c) => `/case-studies/${c.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
    ...jobs.map((j) => `/careers/${j.slug}`),
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
