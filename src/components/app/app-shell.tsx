"use client";

import { CreditCard, LayoutDashboard, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { cn } from "@/lib/utils";

type Props = {
  userEmail: string;
  orgName: string;
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/app", labelKey: "navDashboard" as const, icon: LayoutDashboard, exact: true },
  { href: "/app/billing", labelKey: "navBilling" as const, icon: CreditCard, exact: false },
  { href: "/app/account", labelKey: "navAccount" as const, icon: User, exact: false },
];

export function AppShell({ userEmail, orgName, children }: Props) {
  const t = useTranslations("app");
  const pathname = usePathname();

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
        <nav className="container-wide flex gap-1 border-t border-white/5 pb-0 pt-1">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-b-2 border-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="container-wide relative z-10 py-8">{children}</div>
    </div>
  );
}