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
import { getTestimonials } from "@/lib/content";

export default async function HomePage() {
  const testimonials = await getTestimonials();
  return (
    <>
      <Hero />
      <TrustedBy />
      <ServicesSection />
      <WhyNuul />
      <PortfolioShowcase />
      <AISolutions />
      <InstantEstimate />
      <TestimonialsSection items={testimonials} />
      <ProcessSection />
      <CTASection />
      <ContactSection />
    </>
  );
}
