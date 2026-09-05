import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { TrustedBy } from "@/components/sections/trusted-by";
import { InfrastructureProducts } from "@/components/domains/infrastructure-products";
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
  getServices,
} from "@/lib/content";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [testimonials, allProjects, stats, values, steps, services] = await Promise.all([
    getTestimonials(),
    getProjects(),
    getStats(),
    getValues(),
    getProcessSteps(),
    getServices(),
  ]);
  const featured = allProjects.filter((p) => p.featured);
  const showcaseProjects = featured.length ? featured : allProjects.slice(0, 3);
  return (
    <>
      <Hero stats={stats} />
      <TrustedBy />
      <section className="container-wide">
        <InfrastructureProducts />
      </section>
      <ServicesSection services={services} />
      <WhyNuul stats={stats} values={values} />
      <PortfolioShowcase projects={showcaseProjects} />
      <AISolutions />
      <InstantEstimate services={services} />
      <TestimonialsSection items={testimonials} />
      <ProcessSection steps={steps} />
      <CTASection />
      <ContactSection />
    </>
  );
}
