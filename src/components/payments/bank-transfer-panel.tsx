"use client";

import { useCallback, useState } from "react";
import { Building2, Check, Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatDomainPrice } from "@/lib/domains/format";
import type { BankSettings } from "@/lib/domains/bank-settings";
import { cn } from "@/lib/utils";

type Props = {
  orderNumber: string;
  domain: string;
  totalAmount: number;
  bank: BankSettings;
  className?: string;
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [value]);

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-all font-medium">{value}</p>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}

export function BankTransferPanel({ orderNumber, domain, totalAmount, bank, className }: Props) {
  const t = useTranslations("payments.bank");
  const locale = useLocale();

  return (
    <div className={cn("space-y-4 rounded-2xl border border-white/10 bg-card/60 p-5", className)}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Building2 className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-center">
        <p className="text-xs text-muted-foreground">{t("amount")}</p>
        <p className="text-2xl font-bold">{formatDomainPrice(totalAmount, locale)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{domain}</p>
      </div>

      <div className="space-y-2">
        <CopyRow label={t("bankName")} value={bank.bankName} />
        <CopyRow label={t("accountNumber")} value={bank.bankAccountNumber} />
        <CopyRow label={t("accountName")} value={bank.bankAccountName} />
        {bank.bankIban && <CopyRow label={t("iban")} value={bank.bankIban} />}
        <CopyRow label={t("reference")} value={orderNumber} />
      </div>

      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}