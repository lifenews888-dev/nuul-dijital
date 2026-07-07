"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, ExternalLink, Loader2, Smartphone, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { formatDomainPrice } from "@/lib/domains/format";
import { cn } from "@/lib/utils";

type Deeplink = {
  name: string;
  description: string;
  logo: string;
  link: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: string;
  qrImage: string;
  shortUrl?: string | null;
  deeplinks?: Deeplink[];
  amount: number;
  domain?: string;
  orderNumber?: string;
};

const POLL_MS = 3000;
const TIMEOUT_SEC = 10 * 60;

type PayStatus = "pending" | "checking" | "paid" | "expired";

export function QPayPaymentModal({
  open,
  onClose,
  onSuccess,
  invoiceId,
  qrImage,
  shortUrl,
  deeplinks = [],
  amount,
  domain,
  orderNumber,
}: Props) {
  const t = useTranslations("payments.qpay");
  const locale = useLocale();
  const titleId = useId();
  const [status, setStatus] = useState<PayStatus>("pending");
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SEC);

  useEffect(() => {
    if (!open) {
      setStatus("pending");
      setTimeLeft(TIMEOUT_SEC);
    }
  }, [open]);

  const checkStatus = useCallback(async () => {
    if (status === "paid" || status === "expired") return;

    try {
      setStatus("checking");
      const res = await fetch(`/api/payments/qpay/check?invoiceId=${encodeURIComponent(invoiceId)}`);
      const data = await res.json();

      if (data.paid) {
        setStatus("paid");
        track("domain_payment_success", {
          domain: domain ?? "",
          amount,
          method: "QPAY",
          order_number: orderNumber ?? "",
        });
        setTimeout(() => onSuccess(), 1500);
      } else {
        setStatus("pending");
      }
    } catch {
      setStatus("pending");
    }
  }, [invoiceId, status, onSuccess, domain, amount, orderNumber]);

  useEffect(() => {
    if (!open || status === "paid" || status === "expired") return;
    const interval = setInterval(checkStatus, POLL_MS);
    return () => clearInterval(interval);
  }, [open, checkStatus, status]);

  useEffect(() => {
    if (!open || status === "paid") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, status]);

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
      if (e.key === "Escape" && status !== "paid") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, status]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const qrSrc = qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
          <motion.button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => status !== "paid" && onClose()}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("label")}
                </p>
                <h2 id={titleId} className="text-lg font-semibold">
                  {status === "paid" ? t("successTitle") : t("title")}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={status === "paid"}
                aria-label={t("close")}
              >
                <X />
              </Button>
            </div>

            <div className="px-5 py-6">
              {status === "paid" ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-accent-gradient text-white">
                    <Check className="size-8" />
                  </div>
                  <p className="text-muted-foreground">{t("successBody")}</p>
                  <p className="text-xl font-bold">{formatDomainPrice(amount, locale)}</p>
                </div>
              ) : status === "expired" ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                    <Clock className="size-8" />
                  </div>
                  <p className="font-semibold text-red-300">{t("expiredTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("expiredBody")}</p>
                  <Button variant="outline" onClick={onClose} className="w-full">
                    {t("close")}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-center">
                    <p className="text-xs text-muted-foreground">{t("amountLabel")}</p>
                    <p className="text-2xl font-bold">{formatDomainPrice(amount, locale)}</p>
                    {domain && <p className="mt-1 text-sm text-muted-foreground">{domain}</p>}
                  </div>

                  <div className="mb-4 flex justify-center">
                    <div className="rounded-2xl border border-white/10 bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrSrc}
                        alt={t("qrAlt")}
                        width={200}
                        height={200}
                        className="size-[200px]"
                      />
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground",
                      status === "checking" && "text-accent"
                    )}
                  >
                    <Clock className="size-4" />
                    <span>
                      {t("timer")}: {minutes}:{seconds.toString().padStart(2, "0")}
                    </span>
                    {status === "checking" && <Loader2 className="size-4 animate-spin" />}
                  </div>

                  {shortUrl && (
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-accent-gradient py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25"
                    >
                      <Smartphone className="size-4" />
                      {t("openApp")}
                    </a>
                  )}

                  {deeplinks.length > 0 && (
                    <div>
                      <p className="mb-2 text-center text-xs text-muted-foreground">{t("bankApps")}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {deeplinks.slice(0, 8).map((link) => (
                          <a
                            key={link.name}
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-2 transition hover:border-accent/30"
                          >
                            {link.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={link.logo} alt={link.name} className="size-6 rounded" />
                            ) : (
                              <ExternalLink className="size-4 text-muted-foreground" />
                            )}
                            <span className="line-clamp-1 text-[9px] text-muted-foreground">
                              {link.description || link.name}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}