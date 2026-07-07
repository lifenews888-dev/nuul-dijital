"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { OnboardingNextSteps } from "@/components/domains/onboarding-next-steps";
import {
  CheckoutConfirmation,
  CheckoutQPayAction,
} from "@/components/orders/checkout-confirmation";
import { BankTransferPanel } from "@/components/payments/bank-transfer-panel";
import { QPayPaymentModal } from "@/components/payments/qpay-payment-modal";
import type { BankSettings } from "@/lib/domains/bank-settings";
import { track } from "@/lib/analytics";
import { formatDomainPrice } from "@/lib/domains/format";
import type { DomainSearchResult } from "@/lib/domains/types";
import { cn } from "@/lib/utils";

type OrderSuccess = {
  orderId: string;
  orderNumber: string;
  domain: string;
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

type FormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  years: number;
  registrantType: "INDIVIDUAL" | "BUSINESS";
  registrantAddress: string;
  registrantIdType: string;
  registrantIdNumber: string;
  businessRegNumber: string;
  acceptTerms: boolean;
  acceptRegistryPolicy: boolean;
  paymentMethod: "QPAY" | "BANK_TRANSFER";
};

const ID_TYPES = ["NATIONAL_ID", "PASSPORT", "OTHER"] as const;

type Props = {
  open: boolean;
  result: DomainSearchResult | null;
  journeyId?: string | null;
  onClose: () => void;
  onSuccess?: (order: OrderSuccess) => void;
};

function chip(active: boolean) {
  return cn(
    "rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
    active
      ? "border-accent bg-accent/10 text-foreground"
      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
  );
}

export function DomainCheckoutSheet({ open, result, journeyId, onClose, onSuccess }: Props) {
  const t = useTranslations("domains.checkout");
  const locale = useLocale();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    company: "",
    years: 1,
    registrantType: "INDIVIDUAL",
    registrantAddress: "",
    registrantIdType: "NATIONAL_ID",
    registrantIdNumber: "",
    businessRegNumber: "",
    acceptTerms: false,
    acceptRegistryPolicy: false,
    paymentMethod: "QPAY",
  });
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

  const reset = useCallback(() => {
    setForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      company: "",
      years: 1,
      registrantType: "INDIVIDUAL",
      registrantAddress: "",
      registrantIdType: "NATIONAL_ID",
      registrantIdNumber: "",
      businessRegNumber: "",
      acceptTerms: false,
      acceptRegistryPolicy: false,
      paymentMethod: "QPAY",
    });
    setErrors({});
    setSubmitting(false);
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

  useEffect(() => {
    if (open && panelRef.current) {
      const focusable = panelRef.current.querySelector<HTMLElement>(
        "input, textarea, button, select"
      );
      focusable?.focus();
    }
  }, [open, success]);

  const up = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.customerName.trim().length < 2) next.customerName = t("errors.name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) next.customerEmail = t("errors.email");
    if (form.customerPhone.replace(/[\s-]/g, "").length < 8) next.customerPhone = t("errors.phone");
    if (form.registrantAddress.trim().length < 5) next.registrantAddress = t("errors.address");
    if (form.registrantType === "INDIVIDUAL" && !form.registrantIdNumber.trim()) {
      next.registrantIdNumber = t("errors.idNumber");
    }
    if (form.registrantType === "BUSINESS") {
      if (!form.company.trim()) next.company = t("errors.company");
      if (!form.businessRegNumber.trim()) next.businessRegNumber = t("errors.businessReg");
    }
    if (!form.acceptTerms) next.acceptTerms = t("errors.terms");
    if (!form.acceptRegistryPolicy) next.acceptRegistryPolicy = t("errors.registry");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/domains/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: result.domain,
          years: form.years,
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          company: form.company.trim() || undefined,
          registrantType: form.registrantType,
          registrantAddress: form.registrantAddress.trim(),
          registrantIdType:
            form.registrantType === "INDIVIDUAL" ? form.registrantIdType : undefined,
          registrantIdNumber:
            form.registrantType === "INDIVIDUAL" ? form.registrantIdNumber.trim() : undefined,
          businessRegNumber:
            form.registrantType === "BUSINESS" ? form.businessRegNumber.trim() : undefined,
          paymentMethod: form.paymentMethod,
          journeyId: journeyId ?? undefined,
          locale,
          acceptTerms: true,
          acceptRegistryPolicy: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.error === "DOMAIN_RESERVED") {
          setSubmitError(t("conflict"));
        } else if (data.message) {
          setSubmitError(data.message);
        } else {
          setSubmitError(t("submitError"));
        }
        return;
      }

      const order: OrderSuccess = {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        domain: data.domain,
        totalAmount: data.totalAmount,
        paymentMethod: data.payment?.method ?? form.paymentMethod,
      };
      setSuccess(order);
      track("domain_checkout_start", {
        order_number: order.orderNumber,
        domain: order.domain,
        amount: order.totalAmount,
      });
      onSuccess?.(order);
      if (order.paymentMethod === "BANK_TRANSFER") {
        void loadBankSettings();
      } else {
        void startQPay(order);
      }
    } catch {
      setSubmitError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = result ? result.price * form.years : 0;

  const checkoutSteps = [
    { num: 1, label: t("steps.orderCreated") },
    { num: 2, label: t("steps.pay") },
    { num: 3, label: t("steps.confirmed") },
  ] as const;

  return (
    <AnimatePresence>
      {open && result && (
        <div className="fixed inset-0 z-[60] flex justify-end" role="presentation">
          <motion.button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
            className="relative flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("label")}
                </p>
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {paymentComplete ? t("paidTitle") : success ? t("successTitle") : t("title")}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={submitting}
                aria-label={t("close")}
              >
                <X />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {success ? (
                <CheckoutConfirmation
                  activeStep={paymentComplete ? 3 : 2}
                  title={paymentComplete ? t("paidTitle") : t("successTitle")}
                  body={paymentComplete ? t("paidBody") : t("successBody")}
                  steps={[...checkoutSteps]}
                  details={[
                    { label: t("orderNumber"), value: success.orderNumber, mono: true },
                    { label: t("domain"), value: success.domain },
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
                  {paymentComplete ? (
                    <OnboardingNextSteps
                      domain={success.domain}
                      journeyId={journeyId}
                      className="w-full"
                    />
                  ) : success.paymentMethod === "BANK_TRANSFER" && bank ? (
                    <BankTransferPanel
                      orderNumber={success.orderNumber}
                      domain={success.domain}
                      totalAmount={success.totalAmount}
                      bank={bank}
                      className="w-full text-left"
                    />
                  ) : success.paymentMethod === "QPAY" ? (
                    <CheckoutQPayAction
                      label={t("payWithQPay")}
                      loadingLabel={t("paymentLoading")}
                      loading={qpayLoading}
                      error={qpayError}
                      onClick={() => void startQPay(success)}
                    />
                  ) : null}
                </CheckoutConfirmation>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
                    <p className="font-semibold tracking-tight">{result.domain}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDomainPrice(result.price, locale)}
                      {t("perYear")}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("contactSection")}
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="checkout-name">{t("name")}</Label>
                      <Input
                        id="checkout-name"
                        value={form.customerName}
                        onChange={(e) => up("customerName", e.target.value)}
                        autoComplete="name"
                        required
                      />
                      {errors.customerName && (
                        <p className="text-xs text-red-400">{errors.customerName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkout-email">{t("email")}</Label>
                      <Input
                        id="checkout-email"
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => up("customerEmail", e.target.value)}
                        autoComplete="email"
                        required
                      />
                      {errors.customerEmail && (
                        <p className="text-xs text-red-400">{errors.customerEmail}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkout-phone">{t("phone")}</Label>
                      <Input
                        id="checkout-phone"
                        type="tel"
                        value={form.customerPhone}
                        onChange={(e) => up("customerPhone", e.target.value)}
                        autoComplete="tel"
                        placeholder="+976..."
                        required
                      />
                      {errors.customerPhone && (
                        <p className="text-xs text-red-400">{errors.customerPhone}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("registrantSection")}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={cn(chip(form.registrantType === "INDIVIDUAL"), "flex-1")}
                        onClick={() => up("registrantType", "INDIVIDUAL")}
                      >
                        {t("individual")}
                      </button>
                      <button
                        type="button"
                        className={cn(chip(form.registrantType === "BUSINESS"), "flex-1")}
                        onClick={() => up("registrantType", "BUSINESS")}
                      >
                        {t("business")}
                      </button>
                    </div>

                    {form.registrantType === "BUSINESS" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="checkout-company">{t("company")}</Label>
                          <Input
                            id="checkout-company"
                            value={form.company}
                            onChange={(e) => up("company", e.target.value)}
                            autoComplete="organization"
                          />
                          {errors.company && (
                            <p className="text-xs text-red-400">{errors.company}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="checkout-business-reg">{t("businessReg")}</Label>
                          <Input
                            id="checkout-business-reg"
                            value={form.businessRegNumber}
                            onChange={(e) => up("businessRegNumber", e.target.value)}
                          />
                          {errors.businessRegNumber && (
                            <p className="text-xs text-red-400">{errors.businessRegNumber}</p>
                          )}
                        </div>
                      </>
                    )}

                    {form.registrantType === "INDIVIDUAL" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="checkout-id-type">{t("idType")}</Label>
                          <select
                            id="checkout-id-type"
                            value={form.registrantIdType}
                            onChange={(e) => up("registrantIdType", e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {ID_TYPES.map((id) => (
                              <option key={id} value={id}>
                                {t(`idTypes.${id}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="checkout-id-number">{t("idNumber")}</Label>
                          <Input
                            id="checkout-id-number"
                            value={form.registrantIdNumber}
                            onChange={(e) => up("registrantIdNumber", e.target.value)}
                          />
                          {errors.registrantIdNumber && (
                            <p className="text-xs text-red-400">{errors.registrantIdNumber}</p>
                          )}
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="checkout-address">{t("address")}</Label>
                      <Textarea
                        id="checkout-address"
                        value={form.registrantAddress}
                        onChange={(e) => up("registrantAddress", e.target.value)}
                        rows={3}
                        required
                      />
                      {errors.registrantAddress && (
                        <p className="text-xs text-red-400">{errors.registrantAddress}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("paymentSection")}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={cn(chip(form.paymentMethod === "QPAY"), "flex-1")}
                        onClick={() => up("paymentMethod", "QPAY")}
                      >
                        {t("payMethodQPay")}
                      </button>
                      <button
                        type="button"
                        className={cn(chip(form.paymentMethod === "BANK_TRANSFER"), "flex-1")}
                        onClick={() => up("paymentMethod", "BANK_TRANSFER")}
                      >
                        {t("payMethodBank")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkout-years">{t("years")}</Label>
                    <select
                      id="checkout-years"
                      value={form.years}
                      onChange={(e) => up("years", Number(e.target.value))}
                      className="flex h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {[1, 2, 3, 4, 5].map((y) => (
                        <option key={y} value={y}>
                          {y} {t("yearUnit")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-white/10 bg-card/40 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.acceptTerms}
                        onChange={(e) => up("acceptTerms", e.target.checked)}
                        className="mt-1 size-4 rounded border-white/20 accent-accent"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t("acceptTermsPrefix")}{" "}
                        <Link href="/legal/terms" className="text-accent underline-offset-2 hover:underline" target="_blank">
                          {t("termsLink")}
                        </Link>
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="text-xs text-red-400">{errors.acceptTerms}</p>
                    )}

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.acceptRegistryPolicy}
                        onChange={(e) => up("acceptRegistryPolicy", e.target.checked)}
                        className="mt-1 size-4 rounded border-white/20 accent-accent"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t("acceptRegistryPrefix")}{" "}
                        <Link
                          href="/legal/domain-registration"
                          className="text-accent underline-offset-2 hover:underline"
                          target="_blank"
                        >
                          {t("registryLink")}
                        </Link>
                      </span>
                    </label>
                    {errors.acceptRegistryPolicy && (
                      <p className="text-xs text-red-400">{errors.acceptRegistryPolicy}</p>
                    )}
                  </div>

                  {submitError && (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
                      {submitError}
                    </p>
                  )}

                  <div className="sticky bottom-0 -mx-5 border-t border-white/10 bg-background/95 px-5 py-4 backdrop-blur">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("total")}</span>
                      <span className="text-lg font-bold">{formatDomainPrice(totalAmount, locale)}</span>
                    </div>
                    <Button type="submit" variant="gradient" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" />
                          {t("submitting")}
                        </>
                      ) : (
                        t("submit")
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {success && qpay && (
        <QPayPaymentModal
          open={qpayOpen}
          onClose={() => setQpayOpen(false)}
          onSuccess={() => {
            setQpayOpen(false);
            setPaymentComplete(true);
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
    </AnimatePresence>
  );
}