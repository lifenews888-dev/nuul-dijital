export type Project = {
  slug: string;
  name: string;
  industry: string;
  description: string;
  technologies: string[];
  results: { label: string; value: string }[];
  image: string;
  gallery: string[];
  videoUrl?: string;
  link?: string;
  year: string;
  services: string[];
  featured?: boolean;
};

// Real projects are added from the admin panel.
export const projects: Project[] = [];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export const featuredProjects = projects.filter((p) => p.featured);
