"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  CheckoutConfirmation,
  CheckoutQPayAction,
} from "@/components/orders/checkout-confirmation";
import { BankTransferPanel } from "@/components/payments/bank-transfer-panel";
import { QPayPaymentModal } from "@/components/payments/qpay-payment-modal";
import type { BankSettings } from "@/lib/domains/bank-settings";
import type { PublicDomainOrderSummary } from "@/lib/domains/order-lookup-public";
import { formatDomainPrice } from "@/lib/domains/format";
import { cn } from "@/lib/utils";

type OrderSuccess = {
  orderId: string;
  orderNumber: string;
  domain: string;
  years: number;
  totalAmount: number;
  paymentMethod: "QPAY" | "BANK_TRANSFER";
};

type QPayState = {
  invoiceId: string;
  qrImage: string;
  shortUrl?: string | null;
  deeplinks: Array<{ name: string; description: string; logo: string; link: string }>;
  amount: number;
};

type Props = {
  open: boolean;
  sourceOrder: PublicDomainOrderSummary;
  onClose: () => void;
  onSuccess?: () => void;
};

const selectClass =
  "flex h-11 w-full rounded-xl border border-input bg-muted px-4 text-sm text-foreground backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function chip(active: boolean) {
  return cn(
    "rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
    active
      ? "border-accent bg-accent/15 text-foreground"
      : "border-border bg-muted/60 text-foreground/80 hover:border-accent/30"
  );
}

export function DomainRenewalCheckoutSheet({
  open,
  sourceOrder,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations("domains.renewal");
  const locale = useLocale();
  const titleId = useId();

  const [years, setYears] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"QPAY" | "BANK_TRANSFER">("QPAY");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<OrderSuccess | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [qpay, setQpay] = useState<QPayState | null>(null);
  const [qpayOpen, setQpayOpen] = useState(false);
  const [qpayLoading, setQpayLoading] = useState(false);
  const [qpayError, setQpayError] = useState<string | null>(null);
  const [bank, setBank] = useState<BankSettings | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const renewPrice = sourceOrder.renewPriceMnt ?? 0;
  const totalAmount = renewPrice * years;

  const checkoutSteps = [
    { num: 1, label: t("steps.orderCreated") },
    { num: 2, label: t("steps.pay") },
    { num: 3, label: t("steps.confirmed") },
  ] as const;

  const reset = useCallback(() => {
    setYears(1);
    setPaymentMethod("QPAY");
    setAcceptTerms(false);
    setErrors({});
    setSuccess(null);
    setSubmitError(null);
    setQpay(null);
    setQpayOpen(false);
    setQpayLoading(false);
    setQpayError(null);
    setBank(null);
    setPaymentComplete(false);
  }, []);

  const loadBankSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/domains/bank-settings");
      if (!res.ok) return null;
      const data = await res.json();
      const settings: BankSettings = {
        bankName: data.bankName,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankIban: data.bankIban,
      };
      setBank(settings);
      return settings;
    } catch {
      return null;
    }
  }, []);

  const startQPay = useCallback(
    async (order: OrderSuccess) => {
      setQpayLoading(true);
      setQpayError(null);
      try {
        const res = await fetch("/api/payments/qpay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.orderId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setQpayError(data.message ?? t("paymentError"));
          return;
        }
        setQpay({
          invoiceId: data.invoiceId,
          qrImage: data.qrImage,
          shortUrl: data.shortUrl,
          deeplinks: data.deeplinks ?? [],
          amount: data.amount ?? order.totalAmount,
        });
        setQpayOpen(true);
      } catch {
        setQpayError(t("paymentError"));
      } finally {
        setQpayLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!acceptTerms) next.acceptTerms = t("errors.terms");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/domains/renewals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceOrderId: sourceOrder.id,
          years,
          paymentMethod,
          locale,
          acceptTerms: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.message ?? t("submitError"));
        return;
      }

      const order: OrderSuccess = {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        domain: data.domain,
        years: data.years,
        totalAmount: data.totalAmount,
        paymentMethod,
      };

      setSuccess(order);

      if (paymentMethod === "BANK_TRANSFER") {
        await loadBankSettings();
      } else {
        await startQPay(order);
      }
    } catch {
      setSubmitError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const expiresLabel = sourceOrder.domainExpiresAt
    ? new Date(sourceOrder.domainExpiresAt).toLocaleDateString(locale === "en" ? "en-US" : "mn-MN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const yearOptions = Array.from(
    { length: sourceOrder.maxYears - sourceOrder.minYears + 1 },
    (_, i) => sourceOrder.minYears + i
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && onClose()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <RefreshCw className="size-3.5" />
                  {t("label")}
                </div>
                <h2 id={titleId} className="text-lg font-bold">
                  {paymentComplete ? t("paidTitle") : success ? t("successTitle") : t("title")}
                </h2>
                <p className="text-sm text-muted-foreground">{sourceOrder.domainName}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t("close")}>
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {success ? (
                <CheckoutConfirmation
                  activeStep={paymentComplete ? 3 : 2}
                  title={paymentComplete ? t("paidTitle") : t("successTitle")}
                  body={paymentComplete ? t("paidBody") : t("successBody", { domain: success.domain })}
                  steps={[...checkoutSteps]}
                  details={[
                    { label: t("orderNumber"), value: success.orderNumber, mono: true },
                    { label: t("domain"), value: success.domain },
                    { label: t("years"), value: String(success.years) },
                    {
                      label: t("total"),
                      value: formatDomainPrice(success.totalAmount, locale),
                      highlight: true,
                    },
                  ]}
                  tips={
                    paymentComplete
                      ? [t("paidTip1"), t("paidTip2")]
                      : [t("successTip1"), t("successTip2")]
                  }
                  doneLabel={t("done")}
                  onDone={() => {
                    onSuccess?.();
                    onClose();
                  }}
                >
                  {!paymentComplete && success.paymentMethod === "BANK_TRANSFER" && bank && (
                    <BankTransferPanel
                      orderNumber={success.orderNumber}
                      domain={success.domain}
                      totalAmount={success.totalAmount}
                      bank={bank}
                    />
                  )}
                  {!paymentComplete && success.paymentMethod === "QPAY" && (
                    <CheckoutQPayAction
                      label={t("payWithQPay")}
                      loadingLabel={t("paymentLoading")}
                      loading={qpayLoading}
                      error={qpayError}
                      onClick={() => void startQPay(success)}
                    />
                  )}
                </CheckoutConfirmation>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
                    <p className="font-semibold">{sourceOrder.domainName}</p>
                    {expiresLabel && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("currentExpiry")}: {expiresLabel}
                      </p>
                    )}
                    <p className="mt-2 text-sm">
                      {formatDomainPrice(renewPrice, locale)}
                      {t("perYear")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renewal-years">{t("years")}</Label>
                    <select
                      id="renewal-years"
                      className={selectClass}
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y} {t("yearUnit")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                    <p className="text-sm text-muted-foreground">{t("total")}</p>
                    <p className="text-xl font-bold">{formatDomainPrice(totalAmount, locale)}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t("paymentMethod")}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className={chip(paymentMethod === "QPAY")} onClick={() => setPaymentMethod("QPAY")}>
                        QPay
                      </button>
                      <button
                        type="button"
                        className={chip(paymentMethod === "BANK_TRANSFER")}
                        onClick={() => setPaymentMethod("BANK_TRANSFER")}
                      >
                        {t("bankTransfer")}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      {t("acceptTerms")}{" "}
                      <Link href="/legal/terms" className="text-accent hover:underline">
                        {t("termsLink")}
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-xs text-red-400">{errors.acceptTerms}</p>
                  )}

                  {submitError && (
                    <p className="text-sm text-red-400" role="alert">
                      {submitError}
                    </p>
                  )}

                  <Button type="submit" variant="gradient" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {t("submitting")}
                      </>
                    ) : (
                      t("submit")
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>

          {qpay && success && (
            <QPayPaymentModal
              open={qpayOpen}
              onClose={() => setQpayOpen(false)}
              onSuccess={() => {
                setPaymentComplete(true);
                setQpayOpen(false);
                onSuccess?.();
              }}
              invoiceId={qpay.invoiceId}
              qrImage={qpay.qrImage}
              shortUrl={qpay.shortUrl}
              deeplinks={qpay.deeplinks}
              amount={qpay.amount}
              domain={success.domain}
              orderNumber={success.orderNumber}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}