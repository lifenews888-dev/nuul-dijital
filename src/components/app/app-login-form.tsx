"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/shared/logo";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { cn } from "@/lib/utils";

type LoginMode = "link" | "password";

export function AppLoginForm() {
  const t = useTranslations("app");
  const tp = useTranslations("app.password");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<LoginMode>("link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linkState, setLinkState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [passwordState, setPasswordState] = useState<"idle" | "loading" | "error">("idle");

  const error =
    params.get("error") === "invalid"
      ? t("errors.invalid")
      : params.get("error") === "rate_limited"
        ? t("errors.rateLimited")
        : null;

  const passwordSet = params.get("password_set") === "1";

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkState("loading");
    try {
      const res = await fetch("/api/app/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setLinkState(res.ok ? "sent" : "error");
    } catch {
      setLinkState("error");
    }
  }

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPasswordState("loading");
    const callbackUrl = params.get("callbackUrl") ?? "/app";
    const res = await signIn("customer-password", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) {
      router.push(callbackUrl);
      return;
    }
    setPasswordState("error");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <GradientMesh />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={44} />
          <h1 className="mt-5 text-2xl font-bold text-foreground">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        </div>

        {passwordSet && (
          <div className="mb-4 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm text-foreground">
            {tp("loginAfterReset")}
          </div>
        )}

        {error && (
          <div
            className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              mode === "link"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode("link")}
          >
            <Mail className="size-4" />
            {tp("tabMagicLink")}
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              mode === "password"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode("password")}
          >
            <KeyRound className="size-4" />
            {tp("tabPassword")}
          </button>
        </div>

        {mode === "link" ? (
          linkState === "sent" ? (
            <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-5 text-sm">
              <Mail className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">{t("emailSentTitle")}</p>
                <p className="mt-2 text-muted-foreground">{t("emailSentBody")}</p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={onMagicLink}
              className="rounded-3xl border border-border bg-card p-8"
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
              {linkState === "error" && (
                <p className="mt-3 text-sm text-red-400" role="alert">
                  {t("requestError")}
                </p>
              )}
              <Button
                type="submit"
                variant="gradient"
                className="mt-5 w-full"
                disabled={linkState === "loading"}
              >
                {linkState === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    {t("sendLink")} <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )
        ) : (
          <form
            onSubmit={onPasswordLogin}
            className="rounded-3xl border border-border bg-card p-8"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="app-login-email">{tf("email")}</Label>
              <Input
                id="app-login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={tf("emailPlaceholder")}
              />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="app-login-password">{tp("passwordLabel")}</Label>
                <Link
                  href="/app/forgot-password"
                  className="text-xs text-accent hover:underline"
                >
                  {tp("forgotLink")}
                </Link>
              </div>
              <Input
                id="app-login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {passwordState === "error" && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {tp("errors.loginFailed")}
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{tp("noPasswordHint")}</p>
            <Button
              type="submit"
              variant="gradient"
              className="mt-5 w-full"
              disabled={passwordState === "loading"}
            >
              {passwordState === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Lock className="size-4" />
                  {tp("signIn")}
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