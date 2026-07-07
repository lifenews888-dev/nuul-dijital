"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import type {
  PublicDomainOrderSummary,
  PublicOrderSummary,
  PublicServiceOrderSummary,
} from "@/lib/domains/order-lookup-public";
import { formatDomainPrice } from "@/lib/domains/format";
import { FlowSteps } from "@/components/orders/flow-steps";
import { formatDate } from "@/lib/utils";

type Props = {
  initialEmail: string | null;
  verified?: boolean;
  error?: string | null;
  locale: string;
};

type OrdersResponse = {
  email?: string;
  orders?: PublicOrderSummary[];
  error?: string;
};

function statusVariant(status: PublicOrderSummary["status"]) {
  if (status === "PAID" || status === "FULFILLING") return "accent" as const;
  if (status === "COMPLETED") return "cyan" as const;
  return "default" as const;
}

function serviceStatusKey(status: PublicServiceOrderSummary["status"]) {
  if (status === "FULFILLING" || status === "COMPLETED") {
    return `statusService.${status}` as const;
  }
  return `status.${status}` as const;
}

function OrderVerificationForm({ locale }: { locale: string }) {
  const t = useTranslations("ordersLookup");
  const tf = useTranslations("forms");
  const [email, setEmail] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function onRequestLink(e: React.FormEvent) {
    e.preventDefault();
    setRequestState("loading");
    try {
      const res = await fetch("/api/orders/lookup/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      if (res.ok) {
        track("order_lookup_request", { locale });
        setEmail("");
        setRequestState("sent");
      } else {
        setRequestState("error");
      }
    } catch {
      setRequestState("error");
    }
  }

  const verificationSteps = [
    { num: 1, label: t("steps.enterEmail") },
    { num: 2, label: t("steps.checkInbox") },
    { num: 3, label: t("steps.viewOrders") },
  ];

  if (requestState === "sent") {
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="border-b border-border bg-muted/40 px-6 py-5">
          <FlowSteps steps={verificationSteps} activeStep={2} />
        </div>
        <div className="px-6 py-8 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-lg shadow-accent/20">
            <Inbox className="size-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-foreground">{t("emailSentTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("emailSentBody")}</p>

          <ul className="mt-6 space-y-3 text-left">
            {[t("emailSentTip1"), t("emailSentTip2"), t("emailSentTip3")].map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <span className="text-foreground/80">{tip}</span>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            onClick={() => setRequestState("idle")}
          >
            {t("resendLink")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
      <div className="border-b border-border bg-muted/40 px-6 py-5">
        <FlowSteps steps={verificationSteps} activeStep={1} />
      </div>

      <form onSubmit={onRequestLink} className="px-6 py-8">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{t("formTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("formHint")}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Label htmlFor="order-lookup-email">{tf("email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="order-lookup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder={tf("emailPlaceholder")}
              className="pl-10"
            />
          </div>
        </div>

        {requestState === "error" && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
            {t("requestError")}
          </p>
        )}

        <Button
          type="submit"
          variant="gradient"
          className="mt-5 w-full"
          disabled={requestState === "loading"}
        >
          {requestState === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {t("sendLink")} <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">{t("securityNote")}</p>
      </form>

      <div className="border-t border-border bg-muted/30 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
            <Sparkles className="size-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t("fullAccountTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("fullAccountHint")}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/app/login">{t("fullAccountCta")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OrderCard({
  order,
  locale,
  onRenewDomain,
}: {
  order: PublicOrderSummary;
  locale: string;
  onRenewDomain?: (order: PublicDomainOrderSummary) => void;
}) {
  const t = useTranslations("ordersLookup");
  const ts = useTranslations("services");

  if (order.kind === "domain") {
    return (
      <DomainOrderCard
        order={order}
        locale={locale}
        t={t}
        onRenew={onRenewDomain}
      />
    );
  }

  const planNs = order.serviceType === "HOSTING" ? "hostingPlans" : "emailPlans";
  const planName = ts(`${planNs}.${order.planKey}.name`);
  const title = `${t(`serviceType.${order.serviceType}`)} · ${planName}`;
  const dateLocale = locale === "en" ? "en-US" : "mn-MN";

  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/15">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {order.domainName && (
            <p className="mt-1 text-sm text-muted-foreground">{order.domainName}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {t("orderNumber")}: {order.orderNumber}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(order.createdAt, dateLocale)}
            {order.billingMonths > 1
              ? ` · ${t("billingMonths", { count: order.billingMonths })}`
              : ` · ${ts("pricePeriod")}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Badge variant={statusVariant(order.status)}>{t(serviceStatusKey(order.status))}</Badge>
          <span className="text-sm font-medium">
            {formatDomainPrice(order.totalAmount, locale)}
          </span>
        </div>
      </div>
      {order.payment && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("payment")}: {t(`paymentStatus.${order.payment.status}`)}
          {order.payment.method === "BANK_TRANSFER"
            ? ` · ${t("paymentMethod.BANK_TRANSFER")}`
            : order.payment.method === "QPAY"
              ? ` · ${t("paymentMethod.QPAY")}`
              : ""}
        </p>
      )}
      {order.provisionedAt && order.status === "COMPLETED" && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("provisioned")}: {formatDate(order.provisionedAt, dateLocale)}
        </p>
      )}
    </li>
  );
}

function DomainOrderCard({
  order,
  locale,
  t,
  onRenew,
}: {
  order: PublicDomainOrderSummary;
  locale: string;
  t: ReturnType<typeof useTranslations<"ordersLookup">>;
  onRenew?: (order: PublicDomainOrderSummary) => void;
}) {
  const dateLocale = locale === "en" ? "en-US" : "mn-MN";

  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/15">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">{order.domainName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("orderNumber")}: {order.orderNumber}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(order.createdAt, dateLocale)}
            {order.years > 1 ? ` · ${t("years", { count: order.years })}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Badge variant={statusVariant(order.status)}>{t(`status.${order.status}`)}</Badge>
          <span className="text-sm font-medium">
            {formatDomainPrice(order.totalAmount, locale)}
          </span>
        </div>
      </div>
      {order.payment && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("payment")}: {t(`paymentStatus.${order.payment.status}`)}
          {order.payment.method === "BANK_TRANSFER"
            ? ` · ${t("paymentMethod.BANK_TRANSFER")}`
            : order.payment.method === "QPAY"
              ? ` · ${t("paymentMethod.QPAY")}`
              : ""}
        </p>
      )}
      {order.domainExpiresAt && order.status === "COMPLETED" && !order.isRenewal && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("expires")}: {formatDate(order.domainExpiresAt, dateLocale)}
        </p>
      )}
      {order.renewable && onRenew && (
        <div className="mt-4">
          <Button type="button" size="sm" variant="gradient" onClick={() => onRenew(order)}>
            {t("renewNow")}
          </Button>
        </div>
      )}
      {order.pendingRenewalOrderId && (
        <p className="mt-2 text-xs text-amber-400">{t("renewalPending")}</p>
      )}
    </li>
  );
}

export function OrderLookupPanel({ initialEmail, verified, error, locale }: Props) {
  const t = useTranslations("ordersLookup");
  const [sessionEmail, setSessionEmail] = useState<string | null>(initialEmail);
  const [orders, setOrders] = useState<PublicOrderSummary[]>([]);
  const [ordersState, setOrdersState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setOrdersState("loading");
    setOrdersError(null);
    try {
      const res = await fetch("/api/orders/lookup/orders");
      if (res.status === 401) {
        setSessionEmail(null);
        setOrders([]);
        setOrdersState("idle");
        return;
      }
      const data = (await res.json()) as OrdersResponse;
      if (!res.ok) {
        setOrdersState("error");
        setOrdersError(data.error ?? t("loadError"));
        return;
      }
      setSessionEmail(data.email ?? null);
      setOrders(data.orders ?? []);
      setOrdersState("ready");
    } catch {
      setOrdersState("error");
      setOrdersError(t("loadError"));
    }
  }, [t]);

  useEffect(() => {
    if (sessionEmail) {
      void loadOrders();
    }
  }, [sessionEmail, loadOrders]);

  useEffect(() => {
    if (verified) {
      track("order_lookup_verified");
    }
  }, [verified]);

  async function onSignOut() {
    try {
      await fetch("/api/orders/lookup/signout", { method: "POST" });
    } catch {
      /* best effort */
    }
    setSessionEmail(null);
    setOrders([]);
    setOrdersState("idle");
    track("order_lookup_signout");
  }

  const errorMessage =
    error === "invalid"
      ? t("errors.invalid")
      : error === "rate_limited"
        ? t("errors.rateLimited")
        : null;

  if (sessionEmail) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {verified && (
          <div className="flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-white">
              <Check className="size-5" />
            </div>
            <div>
              <p className="font-medium">{t("verifiedTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("verified")}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Mail className="size-5 text-accent" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("signedInAs")}
              </p>
              <p className="mt-0.5 font-medium">{sessionEmail}</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void onSignOut()}>
            <LogOut className="size-4" />
            {t("signOut")}
          </Button>
        </div>

        {ordersState === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>{t("loading")}</span>
          </div>
        )}

        {ordersState === "error" && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {ordersError}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void loadOrders()}
            >
              {t("retry")}
            </Button>
          </div>
        )}

        {ordersState === "ready" && orders.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
            <Package className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t("empty")}</p>
            <Button variant="gradient" className="mt-6" asChild>
              <Link href="/domains">{t("browseDomains")}</Link>
            </Button>
          </div>
        )}

        {ordersState === "ready" && orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("historyTitle")}</h2>
            <ul className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} locale={locale} />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {errorMessage && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300"
          role="alert"
        >
          <ShieldCheck className="mt-0.5 size-5 shrink-0 opacity-70" />
          <span>{errorMessage}</span>
        </div>
      )}

      <OrderVerificationForm locale={locale} />
    </div>
  );
}