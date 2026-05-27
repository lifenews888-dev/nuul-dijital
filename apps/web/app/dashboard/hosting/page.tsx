"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server,
  Check,
  Loader2,
  Trash2,
  Settings,
  Globe,
  Cpu,
  HardDrive,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { PaymentModal } from "@/components/payments/PaymentModal";
import { trpc } from "@/lib/trpc-client";

// ── Types ────────────────────────────────────────────────────────────

type PlanKey = "STARTER" | "BUSINESS" | "ENTERPRISE";

const PLAN_ICONS: Record<string, typeof Cpu> = {
  STARTER: HardDrive,
  BUSINESS: Cpu,
  ENTERPRISE: Shield,
};

interface HostingAccount {
  id: string;
  serverId: number;
  serverIp: string | null;
  status: "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "DELETED";
  planType: PlanKey;
  domain: string | null;
  expiresAt: string | null;
  createdAt: string;
}

type ProvisioningStep = "idle" | "ordering" | "paying" | "creating" | "installing" | "done";

// ── Component ────────────────────────────────────────────────────────

export default function HostingPage() {
  // Fetch plans from DB
  const { data: plans, isLoading: plansLoading } = trpc.hosting.getHostingPlans.useQuery();

  // Hosting accounts state
  const [accounts, setAccounts] = useState<HostingAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Provisioning flow state
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [provisioningStep, setProvisioningStep] = useState<ProvisioningStep>("idle");
  const [provisioningAccountId, setProvisioningAccountId] = useState<string | null>(null);

  // QPay modal state
  const [qpayOpen, setQpayOpen] = useState(false);
  const [qpayData, setQpayData] = useState<{
    invoiceId: string;
    qrImage: string;
    qrText?: string;
    shortUrl?: string;
    deeplinks?: Array<{ name: string; description: string; logo: string; link: string }>;
    amount: number;
    orderId: string;
  } | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<HostingAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch accounts ───────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/hosting/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ── Poll provisioning status ─────────────────────────────────────

  useEffect(() => {
    if (!provisioningAccountId || provisioningStep === "done" || provisioningStep === "idle") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/hosting/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: provisioningAccountId }),
        });
        const data = await res.json();

        if (data.status === "ACTIVE") {
          setProvisioningStep("done");
          clearInterval(interval);
          fetchAccounts();
        } else if (provisioningStep === "creating") {
          setProvisioningStep("installing");
        }
      } catch {
        // keep polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [provisioningAccountId, provisioningStep, fetchAccounts]);

  // ── Handle plan selection ────────────────────────────────────────

  const handleSelectPlan = async (planType: string, price: number, planName: string) => {
    setSelectedPlan(planType);
    setProvisioningStep("ordering");

    try {
      const orderRes = await fetch("/api/hosting/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType, amount: price }),
      });

      if (!orderRes.ok) {
        throw new Error("Захиалга үүсгэхэд алдаа гарлаа");
      }

      const order = await orderRes.json();

      const qpayRes = await fetch("/api/payments/qpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount: price,
          description: `${planName} хостинг — nuul.digital`,
        }),
      });

      if (!qpayRes.ok) {
        throw new Error("QPay нэхэмжлэх үүсгэхэд алдаа гарлаа");
      }

      const qpayResult = await qpayRes.json();

      setQpayData({
        invoiceId: qpayResult.invoiceId,
        qrImage: qpayResult.qrImage,
        qrText: qpayResult.qrText,
        shortUrl: qpayResult.shortUrl,
        deeplinks: qpayResult.deeplinks,
        amount: price,
        orderId: order.id,
      });

      setProvisioningStep("paying");
      setQpayOpen(true);
    } catch (error) {
      console.error("[HOSTING] Order creation error:", error);
      setProvisioningStep("idle");
      setSelectedPlan(null);
    }
  };

  // ── Handle payment success ───────────────────────────────────────

  const handlePaymentSuccess = async () => {
    setQpayOpen(false);
    setProvisioningStep("creating");

    if (!selectedPlan) return;

    try {
      const res = await fetch("/api/hosting/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: selectedPlan }),
      });

      if (!res.ok) {
        throw new Error("Сервер үүсгэхэд алдаа гарлаа");
      }

      const data = await res.json();
      setProvisioningAccountId(data.accountId);
    } catch (error) {
      console.error("[HOSTING] Provision error:", error);
      setProvisioningStep("idle");
      setSelectedPlan(null);
    }
  };

  // ── Handle delete ────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch("/api/hosting/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: deleteTarget.id }),
      });

      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === deleteTarget.id ? { ...a, status: "DELETED" as const } : a,
          ),
        );
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Status helpers ───────────────────────────────────────────────

  const statusLabel = (status: HostingAccount["status"]) => {
    switch (status) {
      case "PROVISIONING":
        return "Бэлтгэж байна";
      case "ACTIVE":
        return "Идэвхтэй";
      case "SUSPENDED":
        return "Зогсоосон";
      case "DELETED":
        return "Устгагдсан";
    }
  };

  const statusColor = (status: HostingAccount["status"]) => {
    switch (status) {
      case "PROVISIONING":
        return "text-yellow-400";
      case "ACTIVE":
        return "text-t";
      case "SUSPENDED":
        return "text-red-400";
      case "DELETED":
        return "text-txt-3";
    }
  };

  const planLabel = (type: string) => {
    const found = plans?.find((p) => p.type === type);
    return found?.name ?? type;
  };

  function formatPrice(n: number) {
    return new Intl.NumberFormat("mn-MN").format(n);
  }

  // ── Provisioning progress UI ─────────────────────────────────────

  const renderProvisioningProgress = () => {
    if (provisioningStep === "idle" || provisioningStep === "ordering" || provisioningStep === "paying") {
      return null;
    }

    const steps = [
      { key: "creating", label: "Сервер үүсгэж байна..." },
      { key: "installing", label: "Систем суулгаж байна..." },
      { key: "done", label: "Бэлэн!" },
    ];

    const currentIndex = steps.findIndex((s) => s.key === provisioningStep);

    return (
      <div className="mb-8 rounded-2xl border border-v/20 bg-bg-2 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap size={18} className="text-v" />
          <h3 className="font-syne text-base font-bold text-txt">
            {selectedPlan && `${planLabel(selectedPlan)} хостинг бэлтгэж байна`}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {steps.map((step, i) => {
            const isActive = i === currentIndex;
            const isDone = i < currentIndex || provisioningStep === "done";

            return (
              <div key={step.key} className="flex items-center gap-3">
                {i > 0 && (
                  <div
                    className={`h-px w-8 ${isDone ? "bg-t" : "bg-white/[0.06]"}`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      isDone
                        ? "bg-t/20"
                        : isActive
                          ? "bg-v/20"
                          : "bg-white/[0.04]"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle size={14} className="text-t" />
                    ) : isActive ? (
                      <Loader2 size={14} className="animate-spin text-v" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-txt-3" />
                    )}
                  </div>
                  <span
                    className={`text-[13px] ${
                      isDone ? "text-t" : isActive ? "text-txt" : "text-txt-3"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {provisioningStep === "done" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-t/10 px-4 py-3">
            <CheckCircle size={16} className="text-t" />
            <span className="text-[13px] text-t">
              Таны сервер амжилттай бэлэн боллоо!
            </span>
          </div>
        )}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────

  const activeAccounts = accounts.filter((a) => a.status !== "DELETED");

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="font-syne text-2xl font-bold tracking-tight text-txt">
            Хостинг
          </h1>
          <span className="rounded-md bg-t/15 px-2 py-0.5 text-[10px] font-bold text-t">
            Шинэ
          </span>
        </div>
        <p className="mt-1 text-[13px] text-txt-3">
          Hetzner Cloud дээр суурилсан өндөр хурд, найдвартай хостинг
        </p>
      </div>

      {/* Provisioning progress */}
      {renderProvisioningProgress()}

      {/* Plan cards */}
      {plansLoading ? (
        <div className="mb-12 grid items-start gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/[0.04] bg-bg-2 p-7">
              <div className="mb-3 h-10 w-10 rounded-xl bg-white/[0.04]" />
              <div className="mb-2 h-6 w-24 rounded bg-white/[0.04]" />
              <div className="mb-4 h-10 w-36 rounded bg-white/[0.04]" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 w-full rounded bg-white/[0.04]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !plans?.length ? (
        <div className="mb-12 flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-bg-2 py-16">
          <Server size={32} className="mb-3 text-txt-3" />
          <p className="text-[13px] text-txt-3">Хостинг план байхгүй</p>
        </div>
      ) : (
        <div className="mb-12 grid items-start gap-4 md:grid-cols-3">
          {plans.map((plan, idx) => {
            const Icon = PLAN_ICONS[plan.type] ?? HardDrive;
            const featured = idx === 1;
            const isOrdering = selectedPlan === plan.type && provisioningStep !== "idle" && provisioningStep !== "done";

            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-2xl border p-7 transition-all hover:-translate-y-1 ${
                  featured
                    ? "border-v/20 bg-gradient-to-br from-bg-3 to-bg-4 shadow-[0_0_40px_rgba(108,99,255,0.1)]"
                    : "border-white/[0.04] bg-bg-2"
                }`}
              >
                {featured && (
                  <>
                    <div className="absolute left-[10%] right-[10%] top-0 h-0.5 bg-gradient-to-r from-transparent via-v to-transparent" />
                    <span className="mb-3 inline-block rounded-md border border-v/20 bg-v/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-v-soft">
                      Хамгийн их сонгогддог
                    </span>
                  </>
                )}

                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                  <Icon size={20} className="text-v" />
                </div>

                <h3 className="font-syne text-xl font-bold text-txt">{plan.name}</h3>
                <div className="mt-2 font-syne text-3xl font-bold tracking-tight text-gradient-txt-vg">
                  ₮{formatPrice(plan.price)}
                  <span className="text-sm font-normal text-txt-3">/сар</span>
                </div>
                {plan.description && (
                  <p className="mt-1 text-[12px] text-txt-3">{plan.description}</p>
                )}

                <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                <div className="mb-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[12px] text-txt-2">
                      <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] border border-t/30 bg-t/10">
                        <Check size={9} className="text-t" />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.type, plan.price, plan.name)}
                  disabled={isOrdering}
                  className={`w-full rounded-xl py-3 text-[13px] font-bold transition-all disabled:opacity-50 ${
                    featured
                      ? "bg-v text-white shadow-[0_0_20px_rgba(108,99,255,0.25)] hover:shadow-[0_0_30px_rgba(108,99,255,0.4)]"
                      : "border border-v/20 text-v-soft hover:bg-v/5"
                  }`}
                >
                  {isOrdering ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Боловсруулж байна...
                    </span>
                  ) : (
                    "Захиалах"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* My hosting accounts */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Server size={18} className="text-v" />
          <h2 className="font-syne text-lg font-bold text-txt">Миний хостингууд</h2>
        </div>

        {loadingAccounts ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/[0.04] bg-bg-2 py-16">
            <Loader2 size={24} className="animate-spin text-v" />
          </div>
        ) : activeAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-bg-2 py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
              <Globe size={24} className="text-txt-3" />
            </div>
            <p className="text-[13px] text-txt-3">Одоогоор хостинг байхгүй байна</p>
            <p className="mt-1 text-[11px] text-txt-3">Дээрх багцуудаас сонгоно уу</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-bg-2">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-txt-3">
                    Домэйн / IP
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-txt-3">
                    Төлөв
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-txt-3">
                    Багц
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-txt-3">
                    Огноо
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-txt-3">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-white/[0.02] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-v" />
                        <div>
                          {account.domain && (
                            <div className="text-[13px] font-medium text-txt">
                              {account.domain}
                            </div>
                          )}
                          <div className="text-[12px] text-txt-3">
                            {account.serverIp ?? "IP хүлээж байна..."}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1.5 text-[12px] font-medium ${statusColor(account.status)}`}>
                        {account.status === "PROVISIONING" && (
                          <Loader2 size={12} className="animate-spin" />
                        )}
                        {account.status === "ACTIVE" && (
                          <div className="h-1.5 w-1.5 rounded-full bg-t" />
                        )}
                        {account.status === "SUSPENDED" && (
                          <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        )}
                        {statusLabel(account.status)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-v/10 px-2 py-0.5 text-[11px] font-medium text-v-soft">
                        {planLabel(account.planType)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-txt-3">
                      {new Date(account.createdAt).toLocaleDateString("mn-MN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {account.status === "ACTIVE" && (
                          <a
                            href={`http://${account.serverIp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-v/20 px-3 py-1.5 text-[11px] font-medium text-v-soft transition hover:bg-v/5"
                          >
                            <Settings size={12} />
                            Удирдах
                          </a>
                        )}
                        {account.status !== "DELETED" && (
                          <button
                            onClick={() => setDeleteTarget(account)}
                            className="flex items-center gap-1 rounded-lg border border-red-500/20 px-3 py-1.5 text-[11px] font-medium text-red-400 transition hover:bg-red-500/5"
                          >
                            <Trash2 size={12} />
                            Устгах
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QPay Modal */}
      {qpayData && (
        <PaymentModal
          open={qpayOpen}
          onClose={() => {
            setQpayOpen(false);
            setProvisioningStep("idle");
            setSelectedPlan(null);
          }}
          onSuccess={handlePaymentSuccess}
          invoiceId={qpayData.invoiceId}
          qrImage={qpayData.qrImage}
          qrText={qpayData.qrText}
          shortUrl={qpayData.shortUrl}
          deeplinks={qpayData.deeplinks}
          amount={qpayData.amount}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-bg-2 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-syne text-base font-bold text-txt">Сервер устгах</h3>
                <p className="text-[12px] text-txt-3">Энэ үйлдлийг буцаах боломжгүй</p>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-red-500/5 px-4 py-3 text-[12px] text-red-300">
              <strong>{planLabel(deleteTarget.planType)}</strong> багцын сервер
              {deleteTarget.serverIp && ` (${deleteTarget.serverIp})`} бүрмөсөн устгагдах
              болно. Бүх өгөгдөл арилна.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-white/[0.06] py-2.5 text-[13px] font-medium text-txt-2 transition hover:bg-white/[0.04]"
              >
                Болих
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/20 py-2.5 text-[13px] font-bold text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Устгаж байна...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Устгах
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
