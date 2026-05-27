"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Bot,
  MessageSquare,
  Facebook,
  Globe,
  Plus,
  Trash2,
  Settings,
  Copy,
  Check,
  Loader2,
  Power,
  Code,
  Send as SendIcon,
  Sparkles,
  X,
} from "lucide-react";

/* ─── types ─── */
interface ChatBotData {
  id: string;
  name: string;
  platform: "FACEBOOK" | "WEB" | "VIBER" | "TELEGRAM";
  flowJson: string;
  isActive: boolean;
  createdAt: string;
  _count?: { sessions: number };
}

/* ─── constants ─── */
const platformConfig: Record<
  string,
  { label: string; icon: typeof Globe; color: string; bg: string }
> = {
  FACEBOOK: {
    label: "Facebook",
    icon: Facebook,
    color: "text-[#1877F2]",
    bg: "bg-[#1877F2]/10",
  },
  WEB: {
    label: "Web",
    icon: Globe,
    color: "text-t",
    bg: "bg-t/10",
  },
  VIBER: {
    label: "Viber",
    icon: MessageSquare,
    color: "text-[#7360F2]",
    bg: "bg-[#7360F2]/10",
  },
  TELEGRAM: {
    label: "Telegram",
    icon: SendIcon,
    color: "text-[#26A5E4]",
    bg: "bg-[#26A5E4]/10",
  },
};

const tabs = [
  { id: "bots", label: "Миний чатботууд" },
  { id: "create", label: "Шинэ чатбот" },
  { id: "install", label: "Суулгах заавар" },
] as const;

type TabId = (typeof tabs)[number]["id"];

/* ─── page ─── */
export default function ChatbotPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("bots");

  /* ── chatbot list state ── */
  const [chatbots, setChatbots] = useState<ChatBotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ── create form state ── */
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState<
    "FACEBOOK" | "WEB" | "VIBER" | "TELEGRAM"
  >("WEB");
  const [formUseAI, setFormUseAI] = useState(true);
  const [formSystemPrompt, setFormSystemPrompt] = useState(
    "Та манай компанийн AI туслах юм. Монгол хэлээр найрсаг, тодорхой хариулна уу."
  );
  const [creating, setCreating] = useState(false);

  /* ── install tab state ── */
  const [selectedBotId, setSelectedBotId] = useState("");
  const [copiedField, setCopiedField] = useState("");

  /* ── delete confirm ── */
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch chatbots ── */
  const fetchChatbots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chatbot");
      if (!res.ok) throw new Error("Чатботуудыг ачаалж чадсангүй");
      const data = await res.json();
      setChatbots(data.chatbots ?? []);
      if (data.chatbots?.length > 0 && !selectedBotId) {
        setSelectedBotId(data.chatbots[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Алдаа гарлаа"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedBotId]);

  useEffect(() => {
    fetchChatbots();
  }, [fetchChatbots]);

  /* ── create chatbot ── */
  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          platform: formPlatform,
          flowJson: JSON.stringify({
            useAI: formUseAI,
            systemPrompt: formUseAI ? formSystemPrompt : "",
          }),
        }),
      });
      if (!res.ok) throw new Error("Үүсгэж чадсангүй");
      setFormName("");
      setFormSystemPrompt(
        "Та манай компанийн AI туслах юм. Монгол хэлээр найрсаг, тодорхой хариулна уу."
      );
      setActiveTab("bots");
      fetchChatbots();
    } catch {
      setError("Чатбот үүсгэхэд алдаа гарлаа");
    } finally {
      setCreating(false);
    }
  };

  /* ── toggle active ── */
  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/chatbot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      setChatbots((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch {
      // silent fail
    }
  };

  /* ── delete chatbot ── */
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await fetch("/api/chatbot", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setChatbots((prev) => prev.filter((b) => b.id !== id));
      setDeleteId(null);
    } catch {
      setError("Устгахад алдаа гарлаа");
    } finally {
      setDeleting(false);
    }
  };

  /* ── copy helper ── */
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  /* ── platform icon component ── */
  const PlatformBadge = ({ platform }: { platform: string }) => {
    const config = platformConfig[platform] ?? platformConfig.WEB;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.color}`}
      >
        <Icon size={10} />
        {config.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="font-syne text-2xl font-bold tracking-tight text-txt">
            AI Чатбот Builder
          </h1>
          <span className="rounded-md bg-v/15 px-2 py-0.5 text-[10px] font-bold text-v">
            AI
          </span>
        </div>
        <p className="mt-1 text-[13px] text-txt-3">
          Монгол хэлтэй AI чатбот — Facebook, вэбсайт, Viber, Telegram
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Нийт чатбот",
            value: chatbots.length.toString(),
            icon: Bot,
            color: "text-v",
            bg: "bg-v/10",
          },
          {
            label: "Идэвхтэй",
            value: chatbots.filter((b) => b.isActive).length.toString(),
            icon: Power,
            color: "text-t",
            bg: "bg-t/10",
          },
          {
            label: "Нийт платформ",
            value: new Set(chatbots.map((b) => b.platform)).size.toString(),
            icon: Globe,
            color: "text-[#FFB02E]",
            bg: "bg-[#FFB02E]/10",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-white/[0.04] bg-bg-2 p-5"
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}
              >
                <Icon size={16} className={s.color} />
              </div>
              <div className="font-syne text-xl font-bold text-txt">
                {s.value}
              </div>
              <div className="text-[11px] text-txt-3">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.04] bg-bg-2 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-[12px] font-medium transition-all ${
              activeTab === tab.id
                ? "bg-v/15 text-v shadow-sm"
                : "text-txt-3 hover:text-txt-2"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab 1: Миний чатботууд ═══ */}
      {activeTab === "bots" && (
        <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-syne text-base font-bold text-txt">
              Миний чатботууд
            </h3>
            <button
              onClick={() => setActiveTab("create")}
              className="flex items-center gap-1.5 rounded-lg bg-v/10 px-3 py-1.5 text-[11px] font-medium text-v transition-all hover:bg-v/20"
            >
              <Plus size={12} />
              Шинэ
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-txt-3" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[#FF6B9D]/20 bg-[#FF6B9D]/5 p-4 text-[12px] text-[#FF6B9D]">
              {error}
            </div>
          )}

          {!loading && chatbots.length === 0 && (
            <div className="py-16 text-center">
              <Bot size={32} className="mx-auto mb-3 text-txt-3/50" />
              <p className="text-[13px] text-txt-3">
                Чатбот байхгүй байна
              </p>
              <button
                onClick={() => setActiveTab("create")}
                className="mt-4 rounded-lg bg-v/10 px-4 py-2 text-[12px] font-medium text-v transition-all hover:bg-v/20"
              >
                Эхний чатботоо үүсгэх
              </button>
            </div>
          )}

          <div className="space-y-3">
            {chatbots.map((bot) => {
              const config = platformConfig[bot.platform] ?? platformConfig.WEB;
              const Icon = config.icon;
              return (
                <div
                  key={bot.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 transition-all hover:border-v/10"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bg}`}
                    >
                      <Icon size={18} className={config.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-txt">
                        {bot.name}
                        <PlatformBadge platform={bot.platform} />
                      </div>
                      <div className="text-[11px] text-txt-3">
                        Үүсгэсэн:{" "}
                        {new Date(bot.createdAt).toLocaleDateString("mn-MN")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive(bot.id, bot.isActive)}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all ${
                        bot.isActive
                          ? "bg-t/15 text-t hover:bg-t/25"
                          : "bg-white/[0.06] text-txt-3 hover:bg-white/[0.1]"
                      }`}
                    >
                      {bot.isActive ? "Идэвхтэй" : "Зогссон"}
                    </button>

                    {/* Edit — just switch to install tab */}
                    <button
                      onClick={() => {
                        setSelectedBotId(bot.id);
                        setActiveTab("install");
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-3 transition-colors hover:bg-white/[0.04] hover:text-v"
                      title="Засах"
                    >
                      <Settings size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteId(bot.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-3 transition-colors hover:bg-[#FF6B9D]/10 hover:text-[#FF6B9D]"
                      title="Устгах"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Tab 2: Шинэ чатбот ═══ */}
      {activeTab === "create" && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.04] bg-bg-2 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-v/10">
              <Sparkles size={18} className="text-v" />
            </div>
            <div>
              <h3 className="font-syne text-base font-bold text-txt">
                Шинэ чатбот үүсгэх
              </h3>
              <p className="text-[11px] text-txt-3">
                AI-тай эсвэл дүрмийн хариулттай чатбот
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-txt-2">
                Чатботын нэр
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Жишээ: Борлуулалтын бот"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[13px] text-txt outline-none placeholder:text-txt-3 focus:border-v/30"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-txt-2">
                Платформ
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  ["WEB", "FACEBOOK", "VIBER", "TELEGRAM"] as const
                ).map((p) => {
                  const config = platformConfig[p];
                  const Icon = config.icon;
                  return (
                    <button
                      key={p}
                      onClick={() => setFormPlatform(p)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[12px] font-medium transition-all ${
                        formPlatform === p
                          ? `border-v/30 ${config.bg} ${config.color}`
                          : "border-white/[0.06] bg-white/[0.01] text-txt-3 hover:border-white/[0.1]"
                      }`}
                    >
                      <Icon size={14} />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI toggle */}
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div>
                <div className="text-[13px] font-medium text-txt">
                  AI хариулт ашиглах
                </div>
                <div className="text-[11px] text-txt-3">
                  OpenAI GPT ашиглан автомат хариулт өгнө
                </div>
              </div>
              <button
                onClick={() => setFormUseAI(!formUseAI)}
                className={`relative h-6 w-11 rounded-full transition-all ${
                  formUseAI ? "bg-v" : "bg-white/[0.1]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    formUseAI ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* System prompt (shown when AI is on) */}
            {formUseAI && (
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-txt-2">
                  Системийн промпт
                </label>
                <textarea
                  value={formSystemPrompt}
                  onChange={(e) => setFormSystemPrompt(e.target.value)}
                  placeholder="AI-д хэрхэн хариулах заавар бичнэ үү..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[13px] text-txt outline-none placeholder:text-txt-3 focus:border-v/30"
                />
                <p className="mt-1 text-[10px] text-txt-3">
                  Энэ промпт нь AI-д хэрхэн хариулах заавар өгнө. Компанийн
                  мэдээлэл, хариулах хэв маяг зэргийг оруулна уу.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleCreate}
              disabled={creating || !formName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-v py-3 text-[13px] font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(108,99,255,0.3)] disabled:opacity-40"
            >
              {creating ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              Үүсгэх
            </button>
          </div>
        </div>
      )}

      {/* ═══ Tab 3: Суулгах заавар ═══ */}
      {activeTab === "install" && (
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Bot selector */}
          {chatbots.length > 0 && (
            <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-5">
              <label className="mb-2 block text-[12px] font-medium text-txt-2">
                Чатбот сонгох
              </label>
              <select
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[13px] text-txt outline-none focus:border-v/30"
              >
                {chatbots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name} ({platformConfig[bot.platform]?.label})
                  </option>
                ))}
              </select>
            </div>
          )}

          {chatbots.length === 0 && !loading && (
            <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-8 text-center">
              <Code size={28} className="mx-auto mb-3 text-txt-3/50" />
              <p className="text-[13px] text-txt-3">
                Эхлээд чатбот үүсгэнэ үү
              </p>
              <button
                onClick={() => setActiveTab("create")}
                className="mt-3 rounded-lg bg-v/10 px-4 py-2 text-[12px] font-medium text-v hover:bg-v/20"
              >
                Чатбот үүсгэх
              </button>
            </div>
          )}

          {/* Web widget */}
          <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-t/10">
                <Globe size={14} className="text-t" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-txt">
                  Вэб виджет
                </h4>
                <p className="text-[10px] text-txt-3">
                  Вэбсайтдаа нэг мөр код нэмэхэд л болно
                </p>
              </div>
            </div>

            <div className="relative rounded-xl bg-bg-3 p-4">
              <code className="block text-[12px] leading-relaxed text-t">
                {`<script src="https://nuul.digital/widget/${selectedBotId || "YOUR_BOT_ID"}.js"></script>`}
              </code>
              <button
                onClick={() =>
                  copyToClipboard(
                    `<script src="https://nuul.digital/widget/${selectedBotId || "YOUR_BOT_ID"}.js"></script>`,
                    "web-widget"
                  )
                }
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-txt-3 transition-all hover:bg-white/[0.1] hover:text-v"
              >
                {copiedField === "web-widget" ? (
                  <Check size={12} className="text-t" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>

            <p className="mt-3 text-[11px] text-txt-3">
              Энэ кодыг вэбсайтынхаа{" "}
              <code className="rounded bg-bg-3 px-1 py-0.5 text-v">
                {"</body>"}
              </code>{" "}
              тагийн өмнө байрлуулна уу.
            </p>
          </div>

          {/* Facebook setup */}
          <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877F2]/10">
                <Facebook size={14} className="text-[#1877F2]" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-txt">
                  Facebook Messenger
                </h4>
                <p className="text-[10px] text-txt-3">
                  Facebook хуудасны Messenger-тэй холбох
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Webhook URL */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-txt-2">
                  Webhook URL
                </label>
                <div className="relative rounded-xl bg-bg-3 p-3">
                  <code className="block text-[12px] text-t">
                    {`https://nuul.digital/api/webhook/fb/${selectedBotId || "YOUR_BOT_ID"}`}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://nuul.digital/api/webhook/fb/${selectedBotId || "YOUR_BOT_ID"}`,
                        "fb-webhook"
                      )
                    }
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded bg-white/[0.06] text-txt-3 transition-all hover:bg-white/[0.1] hover:text-v"
                  >
                    {copiedField === "fb-webhook" ? (
                      <Check size={10} className="text-t" />
                    ) : (
                      <Copy size={10} />
                    )}
                  </button>
                </div>
              </div>

              {/* Verify token */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-txt-2">
                  Verify Token
                </label>
                <div className="relative rounded-xl bg-bg-3 p-3">
                  <code className="block text-[12px] text-t">
                    nuul_verify_{selectedBotId?.slice(-8) || "TOKEN"}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `nuul_verify_${selectedBotId?.slice(-8) || "TOKEN"}`,
                        "fb-token"
                      )
                    }
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded bg-white/[0.06] text-txt-3 transition-all hover:bg-white/[0.1] hover:text-v"
                  >
                    {copiedField === "fb-token" ? (
                      <Check size={10} className="text-t" />
                    ) : (
                      <Copy size={10} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#1877F2]/10 bg-[#1877F2]/5 p-3">
              <p className="text-[11px] leading-relaxed text-txt-2">
                <strong className="text-[#1877F2]">Тохиргоо:</strong> Facebook
                Developer Console &rarr; Webhooks &rarr; Subscribe to
                &quot;messages&quot; event. Дээрх webhook URL болон verify
                token-ийг оруулна уу.
              </p>
            </div>
          </div>

          {/* Viber / Telegram setup */}
          <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7360F2]/10">
                <MessageSquare size={14} className="text-[#7360F2]" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-txt">
                  Viber / Telegram
                </h4>
                <p className="text-[10px] text-txt-3">
                  Viber болон Telegram бот холболт
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-txt-2">
                  Viber Webhook URL
                </label>
                <div className="relative rounded-xl bg-bg-3 p-3">
                  <code className="block text-[12px] text-t">
                    {`https://nuul.digital/api/webhook/viber/${selectedBotId || "YOUR_BOT_ID"}`}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://nuul.digital/api/webhook/viber/${selectedBotId || "YOUR_BOT_ID"}`,
                        "viber-webhook"
                      )
                    }
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded bg-white/[0.06] text-txt-3 transition-all hover:bg-white/[0.1] hover:text-v"
                  >
                    {copiedField === "viber-webhook" ? (
                      <Check size={10} className="text-t" />
                    ) : (
                      <Copy size={10} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-txt-2">
                  Telegram Webhook URL
                </label>
                <div className="relative rounded-xl bg-bg-3 p-3">
                  <code className="block text-[12px] text-t">
                    {`https://nuul.digital/api/webhook/telegram/${selectedBotId || "YOUR_BOT_ID"}`}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://nuul.digital/api/webhook/telegram/${selectedBotId || "YOUR_BOT_ID"}`,
                        "telegram-webhook"
                      )
                    }
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded bg-white/[0.06] text-txt-3 transition-all hover:bg-white/[0.1] hover:text-v"
                  >
                    {copiedField === "telegram-webhook" ? (
                      <Check size={10} className="text-t" />
                    ) : (
                      <Copy size={10} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete confirmation modal ═══ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-bg-2 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-syne text-base font-bold text-txt">
                Чатбот устгах
              </h3>
              <button
                onClick={() => setDeleteId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-txt-3 hover:bg-white/[0.04] hover:text-txt"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-6 text-[13px] text-txt-2">
              Энэ чатботыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах
              боломжгүй.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl px-4 py-2 text-[13px] text-txt-3 hover:text-txt"
              >
                Болих
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-[#FF6B9D] px-5 py-2 text-[13px] font-medium text-white transition-all hover:shadow-[0_0_16px_rgba(255,107,157,0.3)] disabled:opacity-40"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                Устгах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
