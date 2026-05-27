"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Globe, Server, Cloud, PanelsTopLeft, ShoppingCart,
  Mail, Bot, Users, Phone, BarChart3, Receipt, Headphones, ChevronDown,
  Shield, LogOut, Crown, X, Settings, Briefcase, FileText, LayoutList,
  DollarSign, MessageSquareQuote,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Globe, Server, Cloud, PanelsTopLeft, ShoppingCart,
  Mail, Bot, Users, Phone, BarChart3, Receipt, Headphones, Shield, Crown, Settings,
  Briefcase, FileText, LayoutList, DollarSign, MessageSquareQuote,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  roles?: string[];
  featureKey?: string; // maps to site_settings feature_xxx
  comingSoon?: boolean; // hardcoded override regardless of DB feature flag
}

interface NavGroup {
  group: string;
  roles?: string[];
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: "ҮНДСЭН",
    items: [
      { label: "Хянах самбар", href: "/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    group: "ДОМЭЙН & ХОСТ",
    items: [
      { label: "Домэйн захиалах", href: "/dashboard/domains", icon: "Globe", featureKey: "feature_domain", comingSoon: true },
      { label: "Хостинг", href: "/dashboard/hosting", icon: "Server", badge: "Шинэ", featureKey: "feature_hosting" },
      { label: "VPS/Cloud", href: "/dashboard/vps", icon: "Cloud", featureKey: "feature_vps_cloud" },
    ],
  },
  {
    group: "БИЗНЕСИЙН ХЭРЭГСЭЛ",
    items: [
      { label: "Вэбсайт Builder", href: "/dashboard/website-builder", icon: "PanelsTopLeft", featureKey: "feature_website_builder" },
      { label: "eSeller дэлгүүр", href: "/dashboard/eseller", icon: "ShoppingCart", badge: "4", featureKey: "feature_eseller" },
      { label: "И-мэйл маркетинг", href: "/dashboard/email-marketing", icon: "Mail", featureKey: "feature_email_marketing" },
    ],
  },
  {
    group: "AI ҮЙЛЧИЛГЭЭ",
    items: [
      { label: "AI Чатбот Builder", href: "/dashboard/chatbot", icon: "Bot", badge: "AI", featureKey: "feature_chatbot" },
      { label: "CRM & Борлуулалт", href: "/dashboard/crm", icon: "Users", featureKey: "feature_crm" },
      { label: "Call Center 24/7", href: "/dashboard/call-center", icon: "Phone", featureKey: "feature_call_center" },
    ],
  },
  {
    group: "АДМИН",
    roles: ["ADMIN"],
    items: [
      { label: "Админ панел", href: "/dashboard/admin", icon: "Shield" },
      { label: "Хэрэглэгчид", href: "/dashboard/admin/users", icon: "Users" },
      { label: "Бүх захиалга", href: "/dashboard/admin/orders", icon: "ShoppingCart" },
      { label: "Бүх домэйн", href: "/dashboard/admin/domains", icon: "Globe" },
      { label: "Reseller удирдлага", href: "/dashboard/admin/resellers", icon: "Crown" },
      { label: "Хостинг планууд", href: "/dashboard/admin/hosting", icon: "Server" },
      { label: "Маркетинг багц", href: "/dashboard/admin/pricing", icon: "DollarSign" },
      { label: "Тохиргоо", href: "/dashboard/admin/settings", icon: "Settings" },
    ],
  },
  {
    group: "RESELLER",
    roles: ["RESELLER", "ADMIN"],
    items: [
      { label: "Reseller панел", href: "/dashboard/reseller", icon: "Crown" },
    ],
  },
  {
    group: "КОНТЕНТ",
    roles: ["ADMIN"],
    items: [
      { label: "Үйлчилгээ", href: "/dashboard/admin/services", icon: "Briefcase" },
      { label: "Сэтгэгдэл", href: "/dashboard/admin/testimonials", icon: "MessageSquareQuote" },
      { label: "Блог", href: "/dashboard/admin/blog", icon: "FileText" },
      { label: "Меню удирдлага", href: "/dashboard/admin/navigation", icon: "LayoutList" },
    ],
  },
  {
    group: "ТАЙЛАН",
    items: [
      { label: "Аналитик", href: "/dashboard/analytics", icon: "BarChart3" },
      { label: "Нэхэмжлэх & Төлбөр", href: "/dashboard/invoices", icon: "Receipt" },
      { label: "AI Дэмжлэг", href: "/dashboard/support", icon: "Headphones" },
      { label: "Тохиргоо", href: "/dashboard/settings", icon: "Settings" },
    ],
  },
];

const roleBadge: Record<string, { label: string; bg: string; color: string }> = {
  ADMIN: { label: "Админ", bg: "bg-v/20", color: "text-v-soft" },
  CLIENT: { label: "Хэрэглэгч", bg: "bg-t/20", color: "text-t" },
  RESELLER: { label: "Reseller", bg: "bg-[#FFB02E]/20", color: "text-[#FFB02E]" },
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();
  const [features, setFeatures] = useState<Record<string, string>>({});

  // Fetch feature toggles from DB
  useEffect(() => {
    fetch("/api/settings/features")
      .then((r) => r.json())
      .then((d) => { if (d.features) setFeatures(d.features); })
      .catch(() => {});
  }, []);

  const userRole = (session?.user as { role?: string })?.role ?? "CLIENT";
  const userName = session?.user?.name ?? "Хэрэглэгч";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase();
  const badge = roleBadge[userRole] ?? roleBadge.CLIENT;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Filter nav groups by role
  const visibleGroups = navGroups.filter((group) => {
    if (!group.roles) return true;
    return group.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-white/[0.04] bg-bg-2 transition-transform duration-300 lg:z-40 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "max-lg:-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-v to-v-dark shadow-[0_0_16px_rgba(108,99,255,0.3)]">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L16 14H2Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 7L12.5 13H5.5Z" fill="#fff" opacity=".45" />
                <circle cx="9" cy="9" r="1.6" fill="#fff" />
              </svg>
            </div>
            <span className="font-syne text-[17px] font-bold tracking-tight">
              nuul<span className="text-v-soft">.digital</span>
            </span>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-3 transition-all hover:bg-white/[0.04] hover:text-txt lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4">
          {visibleGroups.map((group) => (
            <div key={group.group} className="mb-2">
              <div className="mb-1.5 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-txt-3">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                // Feature toggle check
                const fStatus = item.featureKey ? features[item.featureKey] : undefined;
                if (fStatus === "false") return null; // hidden
                const comingSoon = fStatus === "coming_soon" || item.comingSoon === true;
                const displayBadge = comingSoon ? "Тун удахгүй" : item.badge;

                return comingSoon ? (
                  <div
                    key={item.href}
                    className="group mb-0.5 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium opacity-50"
                  >
                    <Icon size={17} className="text-txt-4" />
                    <span className="flex-1 text-txt-3">{item.label}</span>
                    <span className="rounded-md bg-[#FFB02E]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#FFB02E]">
                      Тун удахгүй
                    </span>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-v/15 text-white shadow-[inset_0_0_0_1px_rgba(108,99,255,0.25)]"
                        : "text-txt-2 hover:bg-white/[0.03] hover:text-txt"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-v" />
                    )}
                    <Icon
                      size={17}
                      className={isActive ? "text-v" : "text-txt-3 group-hover:text-txt-2"}
                    />
                    <span className="flex-1">{item.label}</span>
                    {displayBadge && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          displayBadge === "AI"
                            ? "bg-v/15 text-v-soft"
                            : displayBadge === "Шинэ"
                              ? "bg-t/15 text-t"
                              : "bg-white/[0.06] text-txt-3"
                        }`}
                      >
                        {displayBadge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="relative border-t border-white/[0.04] p-4">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-3 rounded-lg bg-v/[0.06] p-3 transition-all hover:bg-v/[0.1]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-v/20 text-xs font-bold text-v-soft">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[12px] font-semibold text-txt">{userName}</span>
                <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${badge.bg} ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <div className="truncate text-[11px] text-txt-3">{userEmail}</div>
            </div>
            <ChevronDown size={14} className={`text-txt-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* User dropdown menu */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-xl border border-white/[0.06] bg-bg-3 shadow-xl">
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-[12px] text-txt-2 transition-all hover:bg-white/[0.03] hover:text-txt"
              >
                <Settings size={14} />
                Профайл & Тохиргоо
              </Link>
              {userRole === "ADMIN" && (
                <Link
                  href="/dashboard/admin/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 border-t border-white/[0.04] px-4 py-3 text-[12px] text-txt-2 transition-all hover:bg-white/[0.03] hover:text-txt"
                >
                  <Shield size={14} />
                  Сайтын тохиргоо
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="flex w-full items-center gap-2.5 border-t border-white/[0.04] px-4 py-3 text-[12px] text-red-400 transition-all hover:bg-white/[0.03]"
              >
                <LogOut size={14} />
                Гарах
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
