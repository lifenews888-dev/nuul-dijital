"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LifeBuoy, Loader2, MessageSquarePlus, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PublicTicketDetail, PublicTicketSummary } from "@/lib/support/types";
import { cn } from "@/lib/utils";

type SupportListResponse = {
  tickets?: PublicTicketSummary[];
  error?: string;
};

type SupportDetailResponse = {
  ticket?: PublicTicketDetail;
  error?: string;
  code?: string;
};

const STATUS_KEYS: Record<string, string> = {
  NEW: "statusNew",
  ASSIGNED: "statusAssigned",
  INVESTIGATING: "statusInvestigating",
  WAITING_CUSTOMER: "statusWaitingCustomer",
  RESOLVED: "statusResolved",
  CLOSED: "statusClosed",
};

const CATEGORY_KEYS: Record<string, string> = {
  DOMAIN: "categoryDomain",
  HOSTING: "categoryHosting",
  EMAIL: "categoryEmail",
  DNS: "categoryDns",
  SSL: "categorySsl",
  VPS: "categoryVps",
  BILLING: "categoryBilling",
  WEBSITE: "categoryWebsite",
  OTHER: "categoryOther",
};

const PRIORITY_KEYS: Record<string, string> = {
  LOW: "priorityLow",
  NORMAL: "priorityNormal",
  HIGH: "priorityHigh",
  URGENT: "priorityUrgent",
};

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "NEW":
      return "bg-blue-500/15 text-blue-300";
    case "ASSIGNED":
    case "INVESTIGATING":
      return "bg-amber-500/15 text-amber-300";
    case "WAITING_CUSTOMER":
      return "bg-purple-500/15 text-purple-300";
    case "RESOLVED":
      return "bg-emerald-500/15 text-emerald-300";
    case "CLOSED":
      return "bg-white/10 text-muted-foreground";
    default:
      return "bg-white/10 text-muted-foreground";
  }
}

export function AppSupportPanel() {
  const t = useTranslations("app.support");
  const locale = useLocale();
  const [tickets, setTickets] = useState<PublicTicketSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PublicTicketDetail | null>(null);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [detailState, setDetailState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [priority, setPriority] = useState("NORMAL");
  const [createBody, setCreateBody] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const loadTickets = useCallback(async () => {
    setListState("loading");
    setError(null);
    try {
      const res = await fetch("/api/app/support");
      if (res.status === 401) {
        window.location.href = "/app/login";
        return;
      }
      const data = (await res.json()) as SupportListResponse;
      if (!res.ok) {
        setListState("error");
        setError(data.error ?? t("loadError"));
        return;
      }
      setTickets(data.tickets ?? []);
      setListState("ready");
    } catch {
      setListState("error");
      setError(t("loadError"));
    }
  }, [t]);

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailState("loading");
      setReplyError(null);
      try {
        const res = await fetch(`/api/app/support/${id}`);
        if (res.status === 401) {
          window.location.href = "/app/login";
          return;
        }
        const data = (await res.json()) as SupportDetailResponse;
        if (!res.ok || !data.ticket) {
          setDetailState("error");
          return;
        }
        setDetail(data.ticket);
        setDetailState("ready");
      } catch {
        setDetailState("error");
      }
    },
    []
  );

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else {
      setDetail(null);
      setDetailState("idle");
    }
  }, [selectedId, loadDetail]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/app/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, body: createBody }),
      });
      const data = (await res.json()) as SupportDetailResponse;
      if (!res.ok || !data.ticket) {
        setError(data.error ?? t("createError"));
        return;
      }
      setShowCreate(false);
      setSubject("");
      setCategory("OTHER");
      setPriority("NORMAL");
      setCreateBody("");
      await loadTickets();
      setSelectedId(data.ticket.id);
    } catch {
      setError(t("createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyBody.trim()) return;
    setReplying(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/app/support/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody }),
      });
      const data = (await res.json()) as SupportDetailResponse;
      if (!res.ok) {
        if (data.code === "TICKET_CLOSED") {
          setReplyError(t("ticketClosed"));
        } else {
          setReplyError(data.error ?? t("replyError"));
        }
        return;
      }
      setReplyBody("");
      if (data.ticket) setDetail(data.ticket);
      await loadTickets();
    } catch {
      setReplyError(t("replyError"));
    } finally {
      setReplying(false);
    }
  };

  const canReply =
    detail &&
    detail.status !== "CLOSED" &&
    detail.status !== "RESOLVED";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("ticketsTitle")}</h2>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void loadTickets()}>
              <RefreshCw className="size-4" />
            </Button>
            <Button type="button" size="sm" onClick={() => setShowCreate((v) => !v)}>
              <MessageSquarePlus className="size-4" />
              {t("newTicket")}
            </Button>
          </div>
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("subjectPlaceholder")}
              required
              minLength={3}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                {Object.keys(CATEGORY_KEYS).map((key) => (
                  <option key={key} value={key} className="bg-card">
                    {t(CATEGORY_KEYS[key])}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                {Object.keys(PRIORITY_KEYS).map((key) => (
                  <option key={key} value={key} className="bg-card">
                    {t(PRIORITY_KEYS[key])}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              value={createBody}
              onChange={(e) => setCreateBody(e.target.value)}
              placeholder={t("bodyPlaceholder")}
              required
              minLength={10}
              rows={4}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : t("submitTicket")}
            </Button>
          </form>
        )}

        {listState === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {listState === "error" && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm">
            {error}
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void loadTickets()}>
              {t("retry")}
            </Button>
          </div>
        )}

        {listState === "ready" && tickets.length === 0 && !showCreate && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <LifeBuoy className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        )}

        {listState === "ready" && tickets.length > 0 && (
          <ul className="space-y-2">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    selectedId === ticket.id
                      ? "border-accent/50 bg-accent/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{ticket.number}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        statusBadgeClass(ticket.status)
                      )}
                    >
                      {t(STATUS_KEYS[ticket.status] ?? "statusNew")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(ticket.updatedAt, locale)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:min-h-[420px]">
        {!selectedId && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <LifeBuoy className="mb-3 size-8 opacity-50" />
            {t("selectTicket")}
          </div>
        )}

        {selectedId && detailState === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {selectedId && detailState === "ready" && detail && (
          <div className="flex h-full flex-col">
            <div className="mb-4 border-b border-white/10 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{detail.subject}</h3>
                  <p className="text-sm text-muted-foreground">{detail.number}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    statusBadgeClass(detail.status)
                  )}
                >
                  {t(STATUS_KEYS[detail.status] ?? "statusNew")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{t(CATEGORY_KEYS[detail.category] ?? "categoryOther")}</span>
                <span>{t(PRIORITY_KEYS[detail.priority] ?? "priorityNormal")}</span>
                {detail.slaDueAt && (
                  <span>
                    {t("slaDue")}: {formatDate(detail.slaDueAt, locale)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {detail.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[90%] rounded-xl px-4 py-3 text-sm",
                    msg.authorKind === "CUSTOMER"
                      ? "ml-auto bg-accent/15 text-foreground"
                      : "mr-auto border border-white/10 bg-background/60"
                  )}
                >
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {msg.authorKind === "CUSTOMER"
                      ? msg.isOwn
                        ? t("you")
                        : t("customer")
                      : t("supportTeam")}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(msg.createdAt, locale)}
                  </p>
                </div>
              ))}
            </div>

            {canReply ? (
              <form onSubmit={handleReply} className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={t("replyPlaceholder")}
                  rows={3}
                  required
                />
                {replyError && <p className="text-sm text-red-400">{replyError}</p>}
                <Button type="submit" size="sm" disabled={replying || !replyBody.trim()}>
                  {replying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {t("sendReply")}
                </Button>
              </form>
            ) : (
              <p className="mt-4 border-t border-white/10 pt-4 text-sm text-muted-foreground">
                {t("ticketClosed")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}