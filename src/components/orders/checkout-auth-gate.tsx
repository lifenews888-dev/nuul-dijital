"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { KeyRound, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type LoginMode = "link" | "password";

type Props = {
  onAuthenticated: () => void;
};

export function CheckoutAuthGate({ onAuthenticated }: Props) {
  const t = useTranslations("checkoutAuth");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const pathname = usePathname();

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linkState, setLinkState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [passwordState, setPasswordState] = useState<"idle" | "loading" | "error">("idle");

  const loginHref = `/app/login?callbackUrl=${encodeURIComponent(pathname)}`;

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkState("loading");
    try {
      const res = await fetch("/api/app/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, callbackUrl: pathname }),
      });
      setLinkState(res.ok ? "sent" : "error");
    } catch {
      setLinkState("error");
    }
  }

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPasswordState("loading");
    const res = await signIn("customer-password", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) {
      onAuthenticated();
      return;
    }
    setPasswordState("error");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-accent/25 bg-accent/5 px-5 py-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <p className="font-semibold">{t("title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("body")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            mode === "password"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setMode("password")}
        >
          <Lock className="size-4" />
          {t("tabPassword")}
        </button>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            mode === "link"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setMode("link")}
        >
          <Mail className="size-4" />
          {t("tabMagicLink")}
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={onPasswordLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkout-auth-email">{tf("email")}</Label>
            <Input
              id="checkout-auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkout-auth-password">{t("passwordLabel")}</Label>
            <Input
              id="checkout-auth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {passwordState === "error" && (
            <p className="text-sm text-red-400" role="alert">
              {t("passwordError")}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={passwordState === "loading"}>
            {passwordState === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("signingIn")}
              </>
            ) : (
              <>
                <KeyRound className="size-4" />
                {t("signIn")}
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/app/forgot-password" className="text-accent hover:underline">
              {t("forgotLink")}
            </Link>
            {" · "}
            <Link href={loginHref} className="text-accent hover:underline">
              {t("fullLogin")}
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={onMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkout-auth-link-email">{tf("email")}</Label>
            <Input
              id="checkout-auth-link-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {linkState === "sent" ? (
            <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              {t("linkSent")}
            </div>
          ) : (
            <>
              {linkState === "error" && (
                <p className="text-sm text-red-400" role="alert">
                  {t("linkError")}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={linkState === "loading"}>
                {linkState === "loading" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("sendingLink")}
                  </>
                ) : (
                  <>
                    <Mail className="size-4" />
                    {t("sendLink")}
                  </>
                )}
              </Button>
            </>
          )}
          <p className="text-xs text-muted-foreground">{t("linkHint")}</p>
        </form>
      )}
    </div>
  );
}