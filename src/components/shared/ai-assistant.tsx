"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

/** Renders message text, turning known links/contacts into clickable elements. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\/[a-z-]+(?:\/[a-z-]+)?|hello@nuul\.digital|\+976[\d\s]+)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\/[a-z]/.test(p))
          return (
            <Link key={i} href={p} className="font-medium text-accent underline underline-offset-2">
              {p}
            </Link>
          );
        if (p.includes("@"))
          return (
            <a key={i} href={`mailto:${p}`} className="font-medium text-accent underline">
              {p}
            </a>
          );
        if (p.startsWith("+976"))
          return (
            <a key={i} href={`tel:${p.replace(/\s/g, "")}`} className="font-medium text-accent underline">
              {p}
            </a>
          );
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function AiAssistant() {
  const pathname = usePathname();
  const t = useTranslations("assistant");
  const WELCOME: Msg = { role: "assistant", content: t("welcome") };
  const QUICK = [t("quick1"), t("quick2"), t("quick3")];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>("");

  // stable session id (persists across reloads) so a conversation stays grouped
  useEffect(() => {
    try {
      let id = localStorage.getItem("nuul_chat_sid");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("nuul_chat_sid", id);
      }
      sessionRef.current = id;
    } catch {
      sessionRef.current = Math.random().toString(36).slice(2) + Date.now();
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  if (pathname?.startsWith("/admin")) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    if (messages.length === 1) track("ai_chat_start");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, sessionId: sessionRef.current || undefined }),
      });

      // Rate-limit / validation errors come back as JSON, not a stream.
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: j?.error ?? t("errorGeneric"),
          },
        ]);
        return;
      }

      // Stream the reply token-by-token into a single assistant bubble.
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      setLoading(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("errorNetwork") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label={t("open")}
            className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-accent-gradient text-white shadow-2xl shadow-accent/40"
          >
            <Bot className="size-6" />
            <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-cyan opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full bg-accent-cyan ring-2 ring-background" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-50 flex h-[560px] max-h-[80vh] w-[calc(100vw-3rem)] max-w-[380px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-accent/10 to-accent-cyan/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-gradient">
                  <Bot className="size-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold">{t("title")}</div>
                  <div className="flex items-center gap-1.5 text-xs text-accent-cyan">
                    <span className="size-1.5 animate-pulse rounded-full bg-accent-cyan" /> {t("online")}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label={t("close")} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user" ? "bg-accent text-white" : "bg-white/5 text-foreground"
                    )}
                  >
                    {m.role === "assistant" ? <RichText text={m.content} /> : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-white/5 px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                className="flex-1 rounded-xl border border-input bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                aria-label={t("send")}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
            <div className="flex items-center justify-center gap-1 pb-2 text-[10px] text-muted-foreground">
              <Sparkles className="size-3" /> {t("footer")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
