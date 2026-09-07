import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { TrustedBy } from "@/components/sections/trusted-by";
import { InfrastructureProducts } from "@/components/domains/infrastructure-products";
import { ServicesSection } from "@/components/sections/services-section";
import { WhyNuul } from "@/components/sections/why-nuul";
import { PortfolioShowcase } from "@/components/sections/portfolio-showcase";
import { AISolutions } from "@/components/sections/ai-solutions";
import { IndustriesTabs } from "@/components/sections/industries-tabs";
import { InstantEstimate } from "@/components/sections/instant-estimate";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { ProcessSection } from "@/components/sections/process-section";
import { FaqSection } from "@/components/sections/faq-section";
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

      {/* What we sell, in one block. These three were scattered down the page,
          so the visitor was pitched a service, shown proof, then pitched again;
          /services/ai-chatbots alone was linked three times from this page.
          InfrastructureProducts renders its own <section>, so it is given the
          container and the page's spacing rather than being wrapped in a second
          one. */}
      <InfrastructureProducts className="container-wide py-24 lg:py-32" />
      <ServicesSection services={services} />
      <AISolutions />

      {/* Who the offer is for, before the argument for choosing us. Also the
          only place on this page that links the seven industry pages. */}
      <IndustriesTabs />

      {/* Then the argument, then the proof for it. */}
      <WhyNuul values={values} />
      <PortfolioShowcase projects={showcaseProjects} />
      <TestimonialsSection items={testimonials} />

      {/* How the work runs, before what it costs: the estimate is easier to
          accept once the visitor knows what they get for it. */}
      <ProcessSection steps={steps} />
      <InstantEstimate services={services} />

      {/* Objections answered last, immediately before the ask. The JSON-LD is
          left to /contact so three pages do not all claim to be the FAQ. */}
      <FaqSection emitJsonLd={false} />

      {/* ContactSection closes the page. CTASection sat here too, which asked
          the visitor twice in a row - once to leave for /quote, then to fill in
          the form right below it. */}
      <ContactSection />
    </>
  );
}
