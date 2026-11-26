export type CaseStudy = {
  slug: string;
  title: string;
  client: string;
  industry: string;
  excerpt: string;
  cover: string;
  gallery?: string[];
  videoUrl?: string;
  duration: string;
  services: string[];
  challenge: string;
  approach: string[];
  solution: string;
  results: { label: string; value: string }[];
  testimonial?: { quote: string; author: string; role: string };
  featured?: boolean;
};

// Real case studies are added from the admin panel.
export const caseStudies: CaseStudy[] = [];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
