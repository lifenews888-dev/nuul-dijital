"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  icon: LucideIcon;
  titleKey: "dashboardTitle" | "billingTitle" | "supportTitle" | "accountTitle";
  subtitleKey: "dashboardSubtitle" | "billingSubtitle" | "supportSubtitle" | "accountSubtitle";
};

export function AppPageHeader({ icon: Icon, titleKey, subtitleKey }: Props) {
  const t = useTranslations("app");

  return (
    <div className="mb-8 flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <Icon className="size-5 text-accent" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
        <p className="text-sm text-muted-foreground">{t(subtitleKey)}</p>
      </div>
    </div>
  );
}