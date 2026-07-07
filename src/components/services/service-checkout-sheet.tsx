"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  CheckoutConfirmation,
  CheckoutQPayAction,
} from "@/components/orders/checkout-confirmation";
import { BankTransferPanel } from "@/components/payments/bank-transfer-panel";
import { QPayPaymentModal } from "@/components/payments/qpay-payment-modal";
import type { BankSettings } from "@/lib/domains/bank-settings";
import { track } from "@/lib/analytics";
import { formatDomainPrice } from "@/lib/domains/format";
import { cn } from "@/lib/utils";

type ServiceKind = "hosting" | "email";

type OrderSuccess = {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: "QPAY" | "BANK_TRANSFER";
  planName: string;
  reference: string;
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
  service: ServiceKind;
  planKey: string;
  planName: string;
  priceMnt: number;
  journeyId?: string | null;
  onClose: () => void;
};

function chip(active: boolean) {
  return cn(
    "rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
    active
      ? "border-accent bg-accent/10 text-foreground"
      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
  );
}

export function ServiceCheckoutSheet({
  open,
  service,
  planKey,
  planName,
  priceMnt,
  journeyId,
  onClose,
}: Props) {
  const t = useTranslations("services.checkout");
  const locale = useLocale();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [company, setCompany] = useState("");
  const [domainName, setDomainName] = useState("");
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

  const serviceType = service === "hosting" ? "HOSTING" : "EMAIL";

  const checkoutSteps = [
    { num: 1, label: t("steps.orderCreated") },
    { num: 2, label: t("steps.pay") },
    { num: 3, label: t("steps.confirmed") },
  ] as const;

  const reset = useCallback(() => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCompany("");
    setDomainName("");
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

  const startQPay = useCallback(async (order: OrderSuccess) => {
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
  }, [t]);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (customerName.trim().length < 2) next.customerName = t("errors.name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) next.customerEmail = t("errors.email");
    if (customerPhone.replace(/[\s-]/g, "").length < 8) next.customerPhone = t("errors.phone");
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
      const res = await fetch("/api/services/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          planKey,
          domainName: domainName.trim() || undefined,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          company: company.trim() || undefined,
          paymentMethod,
          journeyId: journeyId ?? undefined,
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
        totalAmount: data.totalAmount,
        paymentMethod,
        planName,
        reference: domainName.trim() || planName,
      };

      setSuccess(order);
      track("service_checkout_start", {
        service,
        plan: planKey,
        order_number: data.orderNumber,
        journeyId: journeyId ?? "",
      });

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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/10 bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 id={titleId} className="text-lg font-bold">
                  {success
                    ? paymentComplete
                      ? t("paidTitle")
                      : t("successTitle")
                    : t("title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {planName} · {formatDomainPrice(priceMnt, locale)}
                  {t("perMonth")}
                </p>
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
                  body={
                    paymentComplete
                      ? t("paidBody")
                      : t("successBody", { planName: success.planName })
                  }
                  steps={[...checkoutSteps]}
                  details={[
                    { label: t("orderNumber"), value: success.orderNumber, mono: true },
                    { label: t("plan"), value: success.planName },
                    ...(success.reference !== success.planName
                      ? [{ label: t("domain"), value: success.reference }]
                      : []),
                    {
                      label: t("total"),
                      value: formatDomainPrice(success.totalAmount, locale),
                      highlight: true,
                    },
                  ]}
                  tips={
                    paymentComplete
                      ? [t("paidTip1"), t("paidTip2"), t("paidTip3")]
                      : [t("successTip1"), t("successTip2"), t("successTip3")]
                  }
                  doneLabel={t("done")}
                  onDone={onClose}
                >
                  {!paymentComplete && success.paymentMethod === "BANK_TRANSFER" && bank && (
                    <BankTransferPanel
                      orderNumber={success.orderNumber}
                      domain={success.reference}
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
                  <div className="space-y-2">
                    <Label htmlFor="svc-name">{t("name")}</Label>
                    <Input
                      id="svc-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      autoComplete="name"
                    />
                    {errors.customerName && (
                      <p className="text-xs text-red-400">{errors.customerName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-email">{t("email")}</Label>
                    <Input
                      id="svc-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      autoComplete="email"
                    />
                    {errors.customerEmail && (
                      <p className="text-xs text-red-400">{errors.customerEmail}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-phone">{t("phone")}</Label>
                    <Input
                      id="svc-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      autoComplete="tel"
                    />
                    {errors.customerPhone && (
                      <p className="text-xs text-red-400">{errors.customerPhone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-company">{t("company")}</Label>
                    <Input
                      id="svc-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      autoComplete="organization"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-domain">{t("domain")}</Label>
                    <Input
                      id="svc-domain"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                      placeholder="example.mn"
                    />
                    <p className="text-xs text-muted-foreground">{t("domainHint")}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t("paymentMethod")}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={chip(paymentMethod === "QPAY")}
                        onClick={() => setPaymentMethod("QPAY")}
                      >
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

                  <Button type="submit" variant="gradient" className="w-full" disabled={submitting || qpayLoading}>
                    {submitting || qpayLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      t("submit", { price: formatDomainPrice(priceMnt, locale) })
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
                setQpayOpen(false);
                setPaymentComplete(true);
                track("service_payment_success", {
                  service,
                  plan: planKey,
                  amount: success.totalAmount,
                  method: "QPAY",
                  order_number: success.orderNumber,
                });
              }}
              invoiceId={qpay.invoiceId}
              qrImage={qpay.qrImage}
              shortUrl={qpay.shortUrl}
              deeplinks={qpay.deeplinks}
              amount={qpay.amount}
              domain={success.reference}
              orderNumber={success.orderNumber}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}