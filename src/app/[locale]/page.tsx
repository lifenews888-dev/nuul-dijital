import { Hero } from "@/components/sections/hero";
import { TrustedBy } from "@/components/sections/trusted-by";
import { ServicesSection } from "@/components/sections/services-section";
import { WhyNuul } from "@/components/sections/why-nuul";
import { PortfolioShowcase } from "@/components/sections/portfolio-showcase";
import { AISolutions } from "@/components/sections/ai-solutions";
import { InstantEstimate } from "@/components/sections/instant-estimate";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { ProcessSection } from "@/components/sections/process-section";
import { CTASection } from "@/components/sections/cta-section";
import { ContactSection } from "@/components/sections/contact-section";
import {
  getTestimonials,
  getProjects,
  getStats,
  getValues,
  getProcessSteps,
} from "@/lib/content";

export default async function HomePage() {
  const [testimonials, allProjects, stats, values, steps] = await Promise.all([
    getTestimonials(),
    getProjects(),
    getStats(),
    getValues(),
    getProcessSteps(),
  ]);
  const featured = allProjects.filter((p) => p.featured);
  const showcaseProjects = featured.length ? featured : allProjects.slice(0, 3);
  return (
    <>
      <Hero stats={stats} />
      <TrustedBy />
      <ServicesSection />
      <WhyNuul stats={stats} values={values} />
      <PortfolioShowcase projects={showcaseProjects} />
      <AISolutions />
      <InstantEstimate />
      <TestimonialsSection items={testimonials} />
      <ProcessSection steps={steps} />
      <CTASection />
      <ContactSection />
    </>
  );
}
