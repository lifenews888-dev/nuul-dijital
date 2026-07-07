import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { ServiceLandingBody } from "@/components/services/service-landing-body";

export type ServicePlanConfig = {
  key: string;
  priceMnt: number;
  featured?: boolean;
};

type ServiceType = "hosting" | "email" | "ssl";

type Props = {
  label: string;
  title: React.ReactNode;
  description: string;
  service: ServiceType;
  journeyId?: string;
  plans?: ServicePlanConfig[];
  planLabels: Record<string, { name: string; features: string[] }>;
  plansTitle?: string;
  comingSoonLabel: string;
  notifyLabel: string;
  featuredLabel: string;
  pricePeriod: string;
  highlight?: React.ReactNode;
  features?: string[];
  featuresTitle?: string;
  hostingNote?: string;
  waitlistTitle: string;
  waitlistSubtitle: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  locale: string;
  ordersEnabled?: boolean;
  orderLabel?: string;
};

export function ServiceLandingTemplate({
  label,
  title,
  description,
  highlight,
  primaryCta,
  secondaryCta,
  ...bodyProps
}: Props) {
  return (
    <>
      <PageHeader label={label} title={title} description={description} />

      <section className="container-wide pb-24">
        {highlight && (
          <Reveal>
            <div className="mx-auto mb-12 max-w-3xl">{highlight}</div>
          </Reveal>
        )}

        <ServiceLandingBody {...bodyProps} />

        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="gradient" size="lg">
              <Link href={primaryCta.href}>
                {primaryCta.label} <ArrowRight className="size-4" />
              </Link>
            </Button>
            {secondaryCta && (
              <Button asChild variant="outline" size="lg">
                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        </Reveal>
      </section>
    </>
  );
}