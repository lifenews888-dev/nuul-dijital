"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/shared/logo";
import { GradientMesh } from "@/components/shared/gradient-mesh";

type Props = {
  mode: "reset" | "account";
  hasPassword?: boolean;
};

export function AppSetPasswordForm({ mode, hasPassword = false }: Props) {
  const t = useTranslations("app.password");
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  if (mode === "reset" && !token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <GradientMesh />
        <p className="relative z-10 text-center text-red-300">{t("errors.invalidToken")}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorCode(null);

    try {
      const res = await fetch("/api/app/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: mode === "reset" ? token : undefined,
          currentPassword: mode === "account" && hasPassword ? currentPassword : undefined,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setState("error");
        setErrorCode(data.error ?? "UNKNOWN");
        return;
      }

      setState("done");
      if (mode === "reset") {
        setTimeout(() => router.push("/app/login?password_set=1"), 1500);
      }
    } catch {
      setState("error");
      setErrorCode("UNKNOWN");
    }
  }

  const errorMessage =
    errorCode === "INVALID_TOKEN"
      ? t("errors.invalidToken")
      : errorCode === "WRONG_PASSWORD"
        ? t("errors.wrongCurrent")
        : errorCode === "CURRENT_REQUIRED"
          ? t("errors.currentRequired")
          : errorCode === "WEAK_PASSWORD"
            ? t("errors.weak")
            : state === "error"
              ? t("errors.generic")
              : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <GradientMesh />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={44} />
          <h1 className="mt-5 text-2xl font-bold text-foreground">
            {mode === "reset" ? t("resetTitle") : hasPassword ? t("changeTitle") : t("setTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "reset" ? t("resetSubtitle") : t("setSubtitle")}
          </p>
        </div>

        {state === "done" ? (
          <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-5 text-sm">
            <Check className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              <p className="font-medium">{t("successTitle")}</p>
              <p className="mt-2 text-muted-foreground">{t("successBody")}</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-border bg-card p-8"
          >
            {mode === "account" && hasPassword && (
              <div className="mb-4 flex flex-col gap-2">
                <Label htmlFor="current-password">{t("currentPassword")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">{t("newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">{t("hint")}</p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {errorMessage && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {errorMessage}
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
                  <Lock className="size-4" />
                  {t("submit")}
                </>
              )}
            </Button>

            {mode === "reset" && (
              <p className="mt-4 text-center text-sm">
                <Link href="/app/login" className="text-accent hover:underline">
                  {t("backToLogin")}
                </Link>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}