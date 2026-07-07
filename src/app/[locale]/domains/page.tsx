import { getTranslations } from "next-intl/server";
import { DomainSearchHero, DomainSearchPanel } from "@/components/domains";
import { DomainsMaintenance } from "@/components/domains/domains-maintenance";
import { FaqSection } from "@/components/sections/faq-section";
import { CTASection } from "@/components/sections/cta-section";
import { sanitizeDomainLabel } from "@/lib/domains/sanitize";
import { getCachedSiteFlag } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("pages.domains");
  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/domains",
    keywords: ["домэйн", "domain", ".mn", "домэйн бүртгэл", "domain search"],
  });
}

async function isDomainsModuleEnabled(): Promise<boolean> {
  if (process.env.DOMAINS_MODULE_ENABLED === "true") return true;
  const readFlag = getCachedSiteFlag("domains_module_enabled", "false");
  return readFlag();
}

async function isAiSuggestEnabled(): Promise<boolean> {
  if (process.env.DOMAINS_AI_SUGGEST_ENABLED === "true") return true;
  const readFlag = getCachedSiteFlag("domains_ai_suggest_enabled", "false");
  return readFlag();
}

export default async function DomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, enabled, aiSuggestEnabled] = await Promise.all([
    searchParams,
    isDomainsModuleEnabled(),
    isAiSuggestEnabled(),
  ]);

  if (!enabled) {
    return <DomainsMaintenance />;
  }

  const initialQuery = q ? sanitizeDomainLabel(q) ?? "" : "";

  return (
    <>
      <DomainSearchHero />
      <section className="container-wide pb-16">
        <DomainSearchPanel initialQuery={initialQuery} aiSuggestEnabled={aiSuggestEnabled} />
      </section>
      <FaqSection />
      <CTASection />
    </>
  );
}