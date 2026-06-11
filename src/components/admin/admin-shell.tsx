"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  FileStack,
  Briefcase,
  FolderKanban,
  Quote,
  Users,
  UserCog,
  HelpCircle,
  BarChart3,
  Gem,
  Workflow,
  Image as ImageIcon,
  Inbox,
  CalendarCheck,
  ClipboardList,
  Bot,
  History,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { LogoMark } from "@/components/shared/logo";
import { ROLE_LABELS, visibleSections, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  section: keyof ReturnType<typeof visibleSections>;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Хяналтын самбар", icon: LayoutDashboard, exact: true, section: "dashboard" },
  { href: "/admin/pages", label: "Хуудаснууд", icon: FileStack, section: "content" },
  { href: "/admin/posts", label: "Нийтлэл", icon: FileText, section: "content" },
  { href: "/admin/projects", label: "Төслүүд", icon: FolderKanban, section: "content" },
  { href: "/admin/case-studies", label: "Кейс судалгаа", icon: Briefcase, section: "content" },
  { href: "/admin/testimonials", label: "Сэтгэгдэл", icon: Quote, section: "testimonials" },
  { href: "/admin/team", label: "Баг", icon: UserCog, section: "team" },
  { href: "/admin/faqs", label: "FAQ", icon: HelpCircle, section: "faqs" },
  { href: "/admin/stats", label: "Статистик", icon: BarChart3, section: "site" },
  { href: "/admin/values", label: "Үнэт зүйлс", icon: Gem, section: "site" },
  { href: "/admin/process", label: "Ажлын явц", icon: Workflow, section: "site" },
  { href: "/admin/careers", label: "Ажлын байр", icon: Users, section: "jobs" },
  { href: "/admin/media", label: "Медиа сан", icon: ImageIcon, section: "media" },
  { href: "/admin/leads", label: "Лидүүд", icon: Inbox, section: "leads" },
  { href: "/admin/briefs", label: "Загвар хүсэлт", icon: ClipboardList, section: "leads" },
  { href: "/admin/contacts", label: "Холбоо барих", icon: Inbox, section: "leads" },
  { href: "/admin/meetings", label: "Уулзалтууд", icon: CalendarCheck, section: "leads" },
  { href: "/admin/chats", label: "AI чат", icon: Bot, section: "leads" },
  { href: "/admin/activity", label: "Үйл ажиллагаа", icon: History, section: "activity" },
  { href: "/admin/settings", label: "Тохиргоо", icon: Settings, section: "settings" },
];

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role?: string };
}) {
  const pathname = usePathname();
  const sections = visibleSections(user.role);
  const nav = NAV.filter((item) => sections[item.section]);
  const roleLabel = ROLE_LABELS[(user.role as Role) ?? "USER"] ?? user.role;
  const [open, setOpen] = useState(false);

  // close the mobile drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const SIDEBAR_W = 256; // px

  return (
    <div className="min-h-screen bg-background">
      {/* ---- Vertical sidebar (fixed; reliable, no breakpoint hiding) ---- */}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-card transition-transform duration-300",
          // hidden off-canvas on mobile unless toggled; always on-screen ≥ lg
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <Link href="/admin" className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
          <LogoMark size={30} />
          <span className="font-bold">
            nuul<span className="text-accent">.</span> admin
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="px-2 py-2 text-xs">
            <div className="truncate font-medium text-foreground">{user.email}</div>
            <div className="tracking-wide text-accent">{roleLabel}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <LogOut className="size-4" /> Гарах
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="no-print fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* ---- Content (offset by sidebar width on desktop) ---- */}
      <div className="lg:pl-64">
        {/* Mobile top bar with hamburger */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Цэс нээх"
            className="flex size-9 items-center justify-center rounded-lg border border-white/10"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="font-bold">admin</span>
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} aria-label="Гарах" className="text-sm text-muted-foreground">
            <LogOut className="size-5" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1280px] p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
