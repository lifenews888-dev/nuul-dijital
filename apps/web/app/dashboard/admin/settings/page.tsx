"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc-client";
import {
  Settings,
  Globe,
  Phone,
  Zap,
  DollarSign,
  Save,
  CheckCircle,
  Loader2,
  LayoutList,
  ArrowRight,
} from "lucide-react";

/* ── Default settings (used when DB is empty) ── */
const DEFAULTS: Record<string, Record<string, string>> = {
  general: {
    site_name: "Nuul.digital",
    site_tagline: "Таны дижитал үүл",
    site_description:
      "Монголын бизнесүүдэд зориулсан иж бүрэн дижитал платформ. Домэйн, хостинг, AI чатбот, CRM.",
    hero_video_url: "",
    hero_headline: "Бизнесээ дижитал\nертөнцөд өсгөнө.",
    hero_subheadline:
      "Вэбсайт, чатбот, маркетинг, FB контент — бид хийж өгнө. Та бизнесээ өсгөнө.",
    hero_tag: "Маркетинг. Вэбсайт. Чатбот.",
  },
  contact: {
    contact_phone: "+976 9911-2233",
    contact_email: "info@nuul.digital",
    contact_address: "Улаанбаатар, Монгол",
    contact_working_hours: "Даваа - Баасан, 09:00-18:00",
    contact_facebook: "https://facebook.com/nuul.digital",
    contact_instagram: "https://instagram.com/nuul.digital",
  },
  features: {
    feature_domain: "active",
    feature_hosting: "active",
    feature_website_builder: "active",
    feature_ai_chatbot: "active",
    feature_crm: "active",
    feature_email_marketing: "active",
    feature_eseller: "active",
    feature_call_center: "coming_soon",
    feature_vps_cloud: "coming_soon",
    feature_professional_services: "active",
    feature_reseller: "active",
    feature_blog: "active",
  },
  pricing: {
    price_domain_mn: "165000",
    price_domain_com: "45000",
    price_domain_org: "50000",
    price_domain_net: "48000",
    price_domain_shop: "55000",
    price_hosting_starter: "99000",
    price_hosting_business: "249000",
    price_hosting_enterprise: "0",
  },
};

const FEATURE_LIST = [
  { key: "feature_domain", name: "Домэйн", icon: "🌐" },
  { key: "feature_hosting", name: "Хостинг", icon: "🖥️" },
  { key: "feature_website_builder", name: "Вэбсайт Builder", icon: "🎨" },
  { key: "feature_ai_chatbot", name: "AI Чатбот", icon: "🤖" },
  { key: "feature_crm", name: "CRM", icon: "📊" },
  { key: "feature_email_marketing", name: "И-мэйл маркетинг", icon: "📧" },
  { key: "feature_eseller", name: "eSeller", icon: "🛒" },
  { key: "feature_call_center", name: "Call Center", icon: "📞" },
  { key: "feature_vps_cloud", name: "VPS/Cloud", icon: "☁️" },
  { key: "feature_professional_services", name: "Мэргэжлийн үйчилгээ", icon: "🔧" },
  { key: "feature_reseller", name: "Reseller", icon: "🤝" },
  { key: "feature_blog", name: "Блог", icon: "📝" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Идэвхтэй", color: "text-green-400 bg-green-400/10 border-green-400/20" },
  { value: "coming_soon", label: "Тун удахгүй", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  { value: "inactive", label: "Идэвхгүй", color: "text-red-400 bg-red-400/10 border-red-400/20" },
];

const tabs = [
  { id: "general", label: "Ерөнхий", icon: Globe },
  { id: "contact", label: "Холбоо барих", icon: Phone },
  { id: "features", label: "Үйлчилгээний тохиргоо", icon: Zap },
  { id: "pricing", label: "Үнийн тохиргоо", icon: DollarSign },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: adminSettings, isLoading } = trpc.settings.getAdminSettings.useQuery();
  const updateMutation = trpc.settings.updateSettings.useMutation();

  // Initialize settings from DB or defaults
  useEffect(() => {
    if (adminSettings) {
      const flat: Record<string, string> = {};
      for (const group of Object.values(adminSettings)) {
        for (const s of group) {
          flat[s.key] = s.value;
        }
      }
      // Merge defaults for any missing keys
      for (const [, groupDefaults] of Object.entries(DEFAULTS)) {
        for (const [key, value] of Object.entries(groupDefaults)) {
          if (!(key in flat)) {
            flat[key] = value;
          }
        }
      }
      setSettings(flat);
    } else if (!isLoading) {
      // DB empty, use all defaults
      const flat: Record<string, string> = {};
      for (const [, groupDefaults] of Object.entries(DEFAULTS)) {
        for (const [key, value] of Object.entries(groupDefaults)) {
          flat[key] = value;
        }
      }
      setSettings(flat);
    }
  }, [adminSettings, isLoading]);

  const handleSave = async (group: string) => {
    setSaving(true);
    const groupKeys = Object.keys(DEFAULTS[group] || {});
    const toSave: Record<string, string> = {};
    for (const key of groupKeys) {
      toSave[key] = settings[key] ?? "";
    }
    try {
      await updateMutation.mutateAsync({ settings: toSave });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    setSaving(false);
  };

  const updateLocal = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-v" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-v/10">
          <Settings className="h-5 w-5 text-v" />
        </div>
        <div>
          <h1 className="font-syne text-xl font-bold text-txt">Сайтын тохиргоо</h1>
          <p className="text-sm text-txt-2">Nuul.digital платформын ерөнхий тохиргоо</p>
        </div>
      </div>

      {/* Nav manager link */}
      <Link
        href="/dashboard/admin/navigation"
        className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-bg-2 px-5 py-4 transition-all hover:border-v/20 hover:bg-v/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-v/10">
            <LayoutList className="h-4.5 w-4.5 text-v" />
          </div>
          <div>
            <span className="text-sm font-semibold text-txt">Меню тохиргоо</span>
            <p className="text-xs text-txt-3">Сайтын навигацийн менюг удирдах</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-txt-3" />
      </Link>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.04] bg-bg-2 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-v/10 text-v"
                  : "text-txt-2 hover:bg-white/[0.03] hover:text-txt"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-white/[0.04] bg-bg-2 p-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-5">
            <h2 className="font-syne text-lg font-semibold text-txt">Ерөнхий мэдээлэл</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-txt-2">
                  Сайтын нэр
                </label>
                <input
                  type="text"
                  value={settings.site_name ?? ""}
                  onChange={(e) => updateLocal("site_name", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-txt-2">
                  Слоган
                </label>
                <input
                  type="text"
                  value={settings.site_tagline ?? ""}
                  onChange={(e) => updateLocal("site_tagline", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-txt-2">
                  Тайлбар
                </label>
                <textarea
                  rows={3}
                  value={settings.site_description ?? ""}
                  onChange={(e) => updateLocal("site_description", e.target.value)}
                  className="w-full resize-none rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                />
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-5">
              <h3 className="mb-1 font-syne text-base font-semibold text-txt">
                Нүүр хуудасны Hero хэсэг
              </h3>
              <p className="mb-4 text-[12px] text-txt-3">
                Үндсэн хуудсанд харагдах видео background, гарчиг, тайлбарыг тохируулна
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-txt-2">
                    Hero видео URL
                  </label>
                  <input
                    type="url"
                    value={settings.hero_video_url ?? ""}
                    onChange={(e) => updateLocal("hero_video_url", e.target.value)}
                    placeholder="https://...mp4 (хоосон бол gradient харагдана)"
                    className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                  />
                  <p className="mt-1 text-[11px] text-txt-3">
                    Pexels, Pixabay, эсвэл өөрсдийн CDN дээр хадгалагдсан .mp4 видеоны URL.
                    Хоосон үлдээвэл анимацилсан gradient харагдана.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-txt-2">
                    Hero гарчиг
                  </label>
                  <textarea
                    rows={2}
                    value={settings.hero_headline ?? ""}
                    onChange={(e) => updateLocal("hero_headline", e.target.value)}
                    placeholder="Бизнесээ дижитал\nертөнцөд өсгөнө."
                    className="w-full resize-none rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                  />
                  <p className="mt-1 text-[11px] text-txt-3">
                    Шинэ мөр болгохын тулд \n тэмдэгт ашиглана уу
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-txt-2">
                    Hero дэд тайлбар
                  </label>
                  <textarea
                    rows={2}
                    value={settings.hero_subheadline ?? ""}
                    onChange={(e) => updateLocal("hero_subheadline", e.target.value)}
                    className="w-full resize-none rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-txt-2">
                    Hero tag (баруун доод glass card)
                  </label>
                  <input
                    type="text"
                    value={settings.hero_tag ?? ""}
                    onChange={(e) => updateLocal("hero_tag", e.target.value)}
                    placeholder="Маркетинг. Вэбсайт. Чатбот."
                    className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                  />
                </div>
              </div>
            </div>

            <SaveButton saving={saving} saved={saved} onClick={() => handleSave("general")} />
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="space-y-5">
            <h2 className="font-syne text-lg font-semibold text-txt">Холбоо барих мэдээлэл</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-txt-2">Утас</label>
                <input
                  type="text"
                  value={settings.contact_phone ?? ""}
                  onChange={(e) => updateLocal("contact_phone", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-txt-2">Имэйл</label>
                <input
                  type="email"
                  value={settings.contact_email ?? ""}
                  onChange={(e) => updateLocal("contact_email", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-txt-2">Хаяг</label>
                <input
                  type="text"
                  value={settings.contact_address ?? ""}
                  onChange={(e) => updateLocal("contact_address", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-txt-2">Ажлын цаг</label>
                <input
                  type="text"
                  value={settings.contact_working_hours ?? ""}
                  onChange={(e) => updateLocal("contact_working_hours", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                  placeholder="Даваа - Баасан, 09:00-18:00"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-txt-2">Facebook URL</label>
                <input
                  type="url"
                  value={settings.contact_facebook ?? ""}
                  onChange={(e) => updateLocal("contact_facebook", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-txt-2">Instagram URL</label>
                <input
                  type="url"
                  value={settings.contact_instagram ?? ""}
                  onChange={(e) => updateLocal("contact_instagram", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>

            <SaveButton saving={saving} saved={saved} onClick={() => handleSave("contact")} />
          </div>
        )}

        {/* Features Tab */}
        {activeTab === "features" && (
          <div className="space-y-5">
            <h2 className="font-syne text-lg font-semibold text-txt">Үйлчилгээний тохиргоо</h2>
            <p className="text-sm text-txt-2">Үйлчилгээ тус бүрийн статусыг тохируулна уу.</p>

            <div className="space-y-2">
              {FEATURE_LIST.map((feature) => {
                const currentValue = settings[feature.key] ?? "active";
                const currentOption = STATUS_OPTIONS.find((o) => o.value === currentValue) ?? STATUS_OPTIONS[0];

                return (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-bg-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{feature.icon}</span>
                      <span className="text-sm font-medium text-txt">{feature.name}</span>
                    </div>

                    <div className="flex gap-1">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateLocal(feature.key, option.value)}
                          className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
                            currentValue === option.value
                              ? option.color
                              : "border-transparent text-txt-3 hover:text-txt-2"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <SaveButton saving={saving} saved={saved} onClick={() => handleSave("features")} />
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="font-syne text-lg font-semibold text-txt">Домэйн үнэ</h2>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { key: "price_domain_mn", label: ".mn" },
                  { key: "price_domain_com", label: ".com" },
                  { key: "price_domain_org", label: ".org" },
                  { key: "price_domain_net", label: ".net" },
                  { key: "price_domain_shop", label: ".shop" },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="mb-1.5 block text-sm font-medium text-txt-2">
                      {item.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-txt-3">₮</span>
                      <input
                        type="number"
                        value={settings[item.key] ?? "0"}
                        onChange={(e) => updateLocal(item.key, e.target.value)}
                        className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-syne text-lg font-semibold text-txt">Хостинг үнэ</h2>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { key: "price_hosting_starter", label: "Starter" },
                  { key: "price_hosting_business", label: "Business" },
                  { key: "price_hosting_enterprise", label: "Enterprise" },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="mb-1.5 block text-sm font-medium text-txt-2">
                      {item.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-txt-3">₮</span>
                      <input
                        type="number"
                        value={settings[item.key] ?? "0"}
                        onChange={(e) => updateLocal(item.key, e.target.value)}
                        className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                      />
                    </div>
                    <p className="mt-1 text-xs text-txt-3">
                      {item.key === "price_hosting_enterprise"
                        ? "0 = Тохиролцоно"
                        : "₮/сар"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <SaveButton saving={saving} saved={saved} onClick={() => handleSave("pricing")} />
          </div>
        )}
      </div>
    </div>
  );
}

function SaveButton({
  saving,
  saved,
  onClick,
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-v to-v-dark px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_#7B6FFF30] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_#7B6FFF50] disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Хадгалах
      </button>
      {saved && (
        <span className="flex items-center gap-1.5 text-sm text-green-400">
          <CheckCircle className="h-4 w-4" />
          Хадгалагдлаа
        </span>
      )}
    </div>
  );
}
