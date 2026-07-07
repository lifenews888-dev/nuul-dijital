"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/shared/logo";
import { GradientMesh } from "@/components/shared/gradient-mesh";

export function AppLoginForm() {
  const t = useTranslations("app");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const error =
    params.get("error") === "invalid"
      ? t("errors.invalid")
      : params.get("error") === "rate_limited"
        ? t("errors.rateLimited")
        : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/app/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <GradientMesh />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={44} />
          <h1 className="mt-5 text-2xl font-bold">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        {state === "sent" ? (
          <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-5 text-sm">
            <Mail className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              <p className="font-medium">{t("emailSentTitle")}</p>
              <p className="mt-2 text-muted-foreground">{t("emailSentBody")}</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-white/10 bg-card p-8"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="app-email">{tf("email")}</Label>
              <Input
                id="app-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={tf("emailPlaceholder")}
              />
            </div>
            {state === "error" && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {t("requestError")}
              </p>
            )}
            <Button
              type="submit"
              variant="gradient"
              className="mt-5 w-full"
              disabled={state === "loading"}
            >
              {state === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  {t("sendLink")} <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/orders/lookup" className="text-accent hover:underline">
            {t("guestLookup")}
          </Link>
        </p>
      </div>
    </div>
  );
}