"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";

export function DomainSearchHero() {
  const t = useTranslations("pages.domains");

  return (
    <PageHeader
      label={t("label")}
      title={t.rich("title", {
        accent: (chunks) => <span className="text-gradient-accent">{chunks}</span>,
      })}
      description={t("description")}
    />
  );
}