"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CreditCard, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QPayPaymentModal } from "@/components/payments/qpay-payment-modal";
import type { PublicInvoiceSummary, PublicSubscriptionSummary } from "@/lib/billing/types";
import { formatDomainPrice } from "@/lib/domains/format";
import { PLAN_KEY_LABELS, SERVICE_TYPE_LABELS } from "@/lib/services/order-status";

type BillingResponse = {
  subscriptions?: PublicSubscriptionSummary[];
  invoices?: PublicInvoiceSummary[];
  error?: string;
};

type PayModalState = {
  qpayInvoiceId: string;
  qrImage: string;
  shortUrl?: string | null;
  deeplinks?: Array<{ name: string; description: string; logo: string; link: string }>;
  amount: number;
  reference: string;
  billingInvoiceNumber: string;
};

type PayResponse = {
  invoiceId?: string;
  qrImage?: string;
  shortUrl?: string | null;
  deeplinks?: PayModalState["deeplinks"];
  amount?: number;
  billingInvoiceNumber?: string;
  reference?: string;
  error?: string;
  message?: string;
};

const SUBSCRIPTION_STATUS_KEYS: Record<string, string> = {
  ACTIVE: "statusActive",
  PAST_DUE: "statusPastDue",
  CANCELLED: "statusCancelled",
  TRIALING: "statusTrialing",
  PAUSED: "statusPaused",
};

const INVOICE_STATUS_KEYS: Record<string, string> = {
  OPEN: "invoiceOpen",
  PAID: "invoicePaid",
  VOID: "invoiceVoid",
  OVERDUE: "invoiceOverdue",
};

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AppBillingPanel() {
  const t = useTranslations("app.billing");
  const locale = useLocale();
  const [subscriptions, setSubscriptions] = useState<PublicSubscriptionSummary[]>([]);
  const [invoices, setInvoices] = useState<PublicInvoiceSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<PayModalState | null>(null);

  const loadBilling = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/app/billing");
      if (res.status === 401) {
        window.location.href = "/app/login";
        return;
      }
      const data = (await res.json()) as BillingResponse;
      if (!res.ok) {
        setState("error");
        setError(data.error ?? t("loadError"));
        return;
      }
      setSubscriptions(data.subscriptions ?? []);
      setInvoices(data.invoices ?? []);
      setState("ready");
    } catch {
      setState("error");
      setError(t("loadError"));
    }
  }, [t]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const startPay = useCallback(
    async (invoice: PublicInvoiceSummary) => {
      setPayingId(invoice.id);
      setPayError(null);
      try {
        const res = await fetch("/api/app/billing/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId: invoice.id }),
        });
        const data = (await res.json()) as PayResponse;
        if (!res.ok || !data.invoiceId || !data.qrImage || data.amount == null) {
          setPayError(data.message ?? data.error ?? t("payError"));
          return;
        }
        setPayModal({
          qpayInvoiceId: data.invoiceId,
          qrImage: data.qrImage,
          shortUrl: data.shortUrl,
          deeplinks: data.deeplinks,
          amount: data.amount,
          reference: data.reference ?? invoice.number,
          billingInvoiceNumber: data.billingInvoiceNumber ?? invoice.number,
        });
      } catch {
        setPayError(t("payError"));
      } finally {
        setPayingId(null);
      }
    },
    [t]
  );

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>{t("loading")}</span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
        {error}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void loadBilling()}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {payError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {payError}
        </div>
      )}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-5 text-accent" />
          <h2 className="text-lg font-semibold">{t("subscriptionsTitle")}</h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
            <CreditCard className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t("subscriptionsEmpty")}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {subscriptions.map((sub) => {
              const statusKey = SUBSCRIPTION_STATUS_KEYS[sub.status] ?? "statusActive";
              const serviceLabel = SERVICE_TYPE_LABELS[sub.serviceType];
              const planLabel = PLAN_KEY_LABELS[sub.planKey] ?? sub.planKey;
              return (
                <li
                  key={sub.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {serviceLabel} — {planLabel}
                      </p>
                      {sub.domainName && (
                        <p className="mt-1 text-sm text-muted-foreground">{sub.domainName}</p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatDomainPrice(sub.unitPriceMnt, locale)} / {t("perMonth")}
                      </p>
                    </div>
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      {t(statusKey)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("period")}: {formatDate(sub.currentPeriodStart, locale)} —{" "}
                    {formatDate(sub.currentPeriodEnd, locale)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-accent" />
          <h2 className="text-lg font-semibold">{t("invoicesTitle")}</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
            <FileText className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t("invoicesEmpty")}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {invoices.map((invoice) => {
              const statusKey = INVOICE_STATUS_KEYS[invoice.status] ?? "invoiceOpen";
              const primaryLine = invoice.lineItems[0]?.description;
              return (
                <li
                  key={invoice.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{invoice.number}</p>
                      {primaryLine && (
                        <p className="mt-1 text-sm text-muted-foreground">{primaryLine}</p>
                      )}
                      <p className="mt-2 text-sm">
                        {formatDomainPrice(invoice.totalMnt, locale)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        invoice.status === "PAID"
                          ? "border border-green-500/30 bg-green-500/10 text-green-400"
                          : "border border-white/20 bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {t(statusKey)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {invoice.paidAt
                        ? `${t("paidOn")} ${formatDate(invoice.paidAt, locale)}`
                        : `${t("dueOn")} ${formatDate(invoice.dueAt, locale)}`}
                    </p>
                    {invoice.payable && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={payingId === invoice.id}
                        onClick={() => void startPay(invoice)}
                      >
                        {payingId === invoice.id ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {t("paying")}
                          </>
                        ) : (
                          t("payNow")
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {payModal && (
        <QPayPaymentModal
          open
          onClose={() => setPayModal(null)}
          onSuccess={() => {
            setPayModal(null);
            void loadBilling();
          }}
          invoiceId={payModal.qpayInvoiceId}
          qrImage={payModal.qrImage}
          shortUrl={payModal.shortUrl}
          deeplinks={payModal.deeplinks}
          amount={payModal.amount}
          domain={payModal.reference}
          orderNumber={payModal.billingInvoiceNumber}
        />
      )}
    </div>
  );
}