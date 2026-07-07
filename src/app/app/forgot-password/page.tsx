"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/shared/logo";
import { GradientMesh } from "@/components/shared/gradient-mesh";

export default function AppForgotPasswordPage() {
  const t = useTranslations("app.password");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/app/auth/forgot", {
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
          <h1 className="mt-5 text-2xl font-bold text-foreground">{t("forgotTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("forgotSubtitle")}</p>
        </div>

        {state === "sent" ? (
          <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-5 text-sm">
            <Mail className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              <p className="font-medium">{t("forgotSentTitle")}</p>
              <p className="mt-2 text-muted-foreground">{t("forgotSentBody")}</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-border bg-card p-8"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="forgot-email">{tf("email")}</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={tf("emailPlaceholder")}
              />
            </div>
            {state === "error" && (
              <p className="mt-3 text-sm text-red-400">{t("errors.generic")}</p>
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
                  {t("forgotSubmit")} <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/app/login" className="text-accent hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}