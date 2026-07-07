"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/shared/gradient-mesh";

type Props = {
  userEmail: string;
  orgName: string;
  children: React.ReactNode;
};

export function AppShell({ userEmail, orgName, children }: Props) {
  const t = useTranslations("app");

  return (
    <div className="relative min-h-screen">
      <GradientMesh className="opacity-40" />
      <header className="relative z-10 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container-wide flex h-16 items-center justify-between gap-4">
          <Link href="/app" className="flex items-center gap-3">
            <LogoMark size={32} />
            <span className="hidden font-semibold sm:inline">{t("portalTitle")}</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right md:block">
              <p className="font-medium">{orgName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void signOut({ callbackUrl: "/app/login" })}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container-wide relative z-10 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <LayoutDashboard className="size-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("dashboardTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("dashboardSubtitle")}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}