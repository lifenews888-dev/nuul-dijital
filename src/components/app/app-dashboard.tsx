"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import type { PublicOrderSummary } from "@/lib/domains/order-lookup-public";
import { OrderCard } from "@/components/orders/order-lookup-panel";

type Props = {
  verified?: boolean;
};

type OrdersResponse = {
  orders?: PublicOrderSummary[];
  organization?: { name: string };
  error?: string;
};

export function AppDashboard({ verified }: Props) {
  const t = useTranslations("app");
  const to = useTranslations("ordersLookup");
  const locale = useLocale();
  const [orders, setOrders] = useState<PublicOrderSummary[]>([]);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/app/orders");
      if (res.status === 401) {
        window.location.href = "/app/login";
        return;
      }
      const data = (await res.json()) as OrdersResponse;
      if (!res.ok) {
        setState("error");
        setError(data.error ?? t("loadError"));
        return;
      }
      setOrders(data.orders ?? []);
      setOrgName(data.organization?.name ?? null);
      setState("ready");
    } catch {
      setState("error");
      setError(t("loadError"));
    }
  }, [t]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (verified) track("app_login_verified");
  }, [verified]);

  return (
    <div className="space-y-6">
      {verified && (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm">
          <Check className="size-5 shrink-0 text-accent" />
          <span>{t("verified")}</span>
        </div>
      )}

      {orgName && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-sm text-muted-foreground">{t("organization")}</p>
          <p className="mt-1 font-medium">{orgName}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/domains"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-accent/30"
        >
          <p className="font-medium">{t("quickDomains")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("quickDomainsHint")}</p>
        </Link>
        <Link
          href="/hosting"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-accent/30"
        >
          <p className="font-medium">{t("quickHosting")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("quickHostingHint")}</p>
        </Link>
        <Link
          href="/business-email"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-accent/30"
        >
          <p className="font-medium">{t("quickEmail")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("quickEmailHint")}</p>
        </Link>
      </div>

      {state === "loading" && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
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

      {state === "ready" && orders.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
          <Package className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t("empty")}</p>
          <Button variant="gradient" className="mt-6" asChild>
            <Link href="/domains">{to("browseDomains")}</Link>
          </Button>
        </div>
      )}

      {state === "ready" && orders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{to("historyTitle")}</h2>
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